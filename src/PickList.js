import React from 'react';
import {
    FlatList,
    Image,
    LayoutAnimation,
    SafeAreaView,
    SectionList,
    StyleSheet,
    View,
    Keyboard,
    Text,
    BackHandler
} from 'react-native';
import SearchBar from 'react-native-general-searchbar';
import InitTree from '@hecom/general-tree';
import Cell from './Cell';
import TitleLine from './TitleLine';
import BottomBar from './BottomBar';
import ShowAllCell from './ShowAllCell';
import Types from './Types';
import { isCascade } from './Util';
import { getImage, single_check_image } from './DefaultRow';
import { ScrollView } from 'react-native-gesture-handler';
import NaviBar from '@hecom/react-native-pure-navigation-bar';
import Listener from '@hecom/listener';
export default class extends React.PureComponent {

    static propTypes = Types;

    static defaultProps = {
        isCascade: true,
        multilevel: false,
        multiselect: false,
        showSearchView: true,
        showTitleLine: false,
        showAllCell: true,
        showCount: false,
        numberOfTextLines: 0,
        directBackWhenSingle: true,
        cancelableWhenDirectBack: true,
        childrenKey: 'children',
        idKey: 'id',
        labelKey: 'label',
        labels: {
            close: 'Close',
            search: 'Search',
            selectAll: 'Select All',
            deselectAll: 'Deselect All',
            ok: 'OK',
            choose: 'Please Choose',
            cancel: 'Cancel',
        },
        renderSingleSelectIcon: () => <Image source={single_check_image()} style={styles.icon} />,
        renderMultiSelectIcon: (selectState) => <Image source={getImage(selectState)} style={styles.multiIcon} />,
        prefixTestID: '',
        refreshSingleCell: true,
        showRegularCount: false, // 是否右侧显示固定的数字(不管是否是叶子节点，都会有)
        regularCountKey: 'count', // 固定数字的Key
        showSearchLeafNodeParentName: false, // 是否在搜索时，在叶子节点显示父节点的名字
        defaultMultiLevelShowItemIndex: undefined, // 多选层级时，默认展开显示的条目
    };

    constructor(props) {
        super(props);
        const info = this._getInfoFromProps(props);
        this.state = {
            levelItems: [info.tree],
            selectedItems: info.selectItems,
            searchText: '',
            isSearching: false,
            // screenWidth: 0,
            screenWidth: global.screenWidth(),
            // scrollPageWidth: 0,
            scrollPageWidth: this.props.multilevel && info.tree.getDeepth(true) > 1 ? 250 : global.screenWidth(),
            addedLevelItems: info.addedTrees,
            shadowItems: [],
            levelDeep: info.tree.getDeepth(true),
        };
    }

    _getInfoFromProps = (props) => {
        const {data, firstRawRootPath, childrenKey, idKey, labelKey, firstTitleLine, selectedIds, refreshSingleCell, rootPath, parentPath, addedData} = props;
        this.defaultRootId = '__root__';
        const idOnlyKey = Array.isArray(idKey) ? idKey[0] : idKey;
        const treeRoot = Array.isArray(data) ?
            {[childrenKey]: data, [idOnlyKey]: this.defaultRootId, [labelKey]: firstTitleLine, 'firstRawRootPath': firstRawRootPath} :
            {[childrenKey]: [data], [idOnlyKey]: this.defaultRootId, [labelKey]: firstTitleLine, 'firstRawRootPath': firstRawRootPath};
        const tree = InitTree({
            root: treeRoot,
            childrenKey: childrenKey,
            idKey: idKey,
            onStatusChange: (treenode) => Listener.trigger(
                '__treenode__status__update__' + (refreshSingleCell ? treenode.getStringId() : '')
            ),
            rootPath: rootPath,
            parentPath: parentPath
        });
        this.isCascade = isCascade(props);
        let addedTrees = [];
        let selectItems = tree.setInitialState(selectedIds, this.isCascade);
        if (Array.isArray(addedData) && addedData.length > 0) {
            addedData.forEach(item => {
                const addedTreeRoot = {[childrenKey]: item, [idOnlyKey]: this.defaultRootId, [labelKey]: firstTitleLine, 'firstRawRootPath': firstRawRootPath};
                const addedTree = InitTree({
                    root: addedTreeRoot,
                    childrenKey: childrenKey,
                    idKey: idKey,
                    onStatusChange: (treenode) => Listener.trigger(
                        '__treenode__status__update__' + (refreshSingleCell ? treenode.getStringId() : '')
                    ),
                    rootPath: rootPath,
                    parentPath: parentPath
                });
                addedTrees.push(addedTree);
            });

            addedTrees.forEach(addedTree => {
                let tmp = addedTree.setInitialState(selectedIds, this.isCascade);
                selectItems = selectItems.concat(tmp);
            });
        }
        return {tree, addedTrees, selectItems};
    };

    componentDidUpdate(prevProps) {
        if (
            JSON.stringify(prevProps) !== JSON.stringify(this.props)
        ) {
            const info = this._getInfoFromProps(this.props);

            const scrollPageWidth = this.props.multilevel && info.tree.getDeepth(true) > 1 && !this.state.isSearching ? 250 : this.state.screenWidth;
            this.setState({
                    levelItems: [info.tree],
                    selectedItems: info.selectItems,
                    searchText: '',
                    isSearching: false,
                    scrollPageWidth,
                    addedLevelItems: info.addedTrees,
                    shadowItems: [],
                    levelDeep: info.tree.getDeepth(true),
            });
            this.forceUpdate();
        }
    }

    UNSAFE_componentWillMount() {
        BackHandler.addEventListener('hardwareBackPress', () => {
            const curIndex = this.state.levelItems.length;
            if (curIndex <= 1 || !this.props.showTitleLine) {
                this._popToPrevious();
            } else {
                this._handlePressToPrevPage(curIndex - 1);
            }
            return true;
        });
    }

    componentWillUnmount() {
        BackHandler.removeEventListener('hardwareBackPress', () => {
            const curIndex = this.state.levelItems.length;
            if (curIndex <= 1 || !this.props.showTitleLine) {
                this._popToPrevious();
            } else {
                this._handlePressToPrevPage(curIndex - 1);
            }
            return true;
        });
    }

    componentDidMount() {
        const {defaultMultiLevelShowItemIndex} = this.props;
        if (defaultMultiLevelShowItemIndex !== undefined) {
            const childrenLevelItems = this.state.levelItems[0]?.getChildren();
            if (childrenLevelItems && Array.isArray(childrenLevelItems) && childrenLevelItems.length > defaultMultiLevelShowItemIndex) {
                this._clickRow(childrenLevelItems[defaultMultiLevelShowItemIndex]);
            }
        }
    }

    render() {
        const hasBottom = this.props.showBottomView !== undefined ?
            this.props.showBottomView :
            this.props.multiselect;
        const {rightTitle, rightClick, multiselect, directBackWhenSingle} = this.props;
        const hideEmpty = this.state.searchText && this.state.searchText.length > 0;
        const rightElement = rightTitle && rightTitle.length > 0 ? rightTitle : !multiselect && !directBackWhenSingle ? this.props.labels.ok : undefined
        const onRight = rightTitle && rightTitle.length > 0 ? rightClick || this._clickOK : !multiselect && !directBackWhenSingle ? this._clickOK : undefined
        return (
            <View style={styles.view}>
                <NaviBar title={this.props.title} rightElement={rightElement} onRight={onRight} />
                {this.props.showSearchView && this._renderSearchBar()}
                <SafeAreaView style={this.props.multilevel && this.state.levelDeep >1 ? [styles.innersafeview, {'backgroundColor' : 'white'}] : styles.innersafeview}>
                    <View
                        style={{flex: 1, overflow: 'hidden'}}
                        onLayout={({nativeEvent: {layout: {width}}}) => {
                            if (width > 0 && width !== this.state.screenWidth) {
                                this.setState({
                                    screenWidth: width,
                                    frame: {
                                        top: 0,
                                        bottom: 0,
                                        // left: 0 - (this.state.levelItems.length - 1) * width,
                                    },
                                    scrollPageWidth: this.props.multilevel && this.state.levelDeep > 1 && !this.state.isSearching ? 250 : width,
                                });
                            }
                        }}
                    >
                        {!this.state.isSearching && this._renderHeader()}
                        {this.state.isSearching ? (hideEmpty ? this._renderSearchingView() : this._renderEmpty()) : this._renderPageView()}
                    </View>
                </SafeAreaView>
                {hasBottom && this._renderBottomView()}
            </View>
        );
    }

    _renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Image style={styles.emptyImage} source={require('./image/EmptySearch.png')} />
        </View>
    );

    _renderSearchBar = () => {
        const prefixTestID = this.props.prefixTestID || '';
        return (
            <SafeAreaView style={styles.searchbarContainer}>
                <SearchBar
                    textInputProps={{
                        testID: `${prefixTestID}Input`,
                    }}
                    placeholder={this.props.labels.search}
                    cancelText={this.props.labels.cancel}
                    searchText={this.state.searchText}
                    onPressCancel={() => {
                        LayoutAnimation.linear();
                        this.setState({isSearching: false, searchText: '', scrollPageWidth: this.props.multilevel && this.state.levelDeep > 1 ? 250 : this.state.screenWidth});
                    }}
                    onSubmitEditing={this._onSubmit}
                    onChangeText={this._onSearch}
                    canCancel={true}
                    isSearching={this.state.isSearching}
                    style = {{
                        view: {backgroundColor: '#F7F7F9'},
                        inputView: {backgroundColor: 'white'}
                    }}
                />
            </SafeAreaView>
        );
    };

    _onScroll(event) {
        Keyboard.dismiss();
    }

    _renderSearchingView = () => {
        const style = {width: this.state.screenWidth};
        const searchKeys = this.props.searchKeys || [];
        const data = this.state.levelItems[0].search(
            this.state.searchText,
            [...searchKeys, this.props.labelKey],
            this.props.multiselect,
            false,
            false
        ).filter(node => this.props.selectable ? this.props.selectable(node): true);
        return (
            <View style={[styles.searchingViewContainer, style]}>
                <FlatList
                    key={this.state.searchText}
                    data={data}
                    renderItem={this._renderRow}
                    style={[styles.listview, style]}
                    contentContainerStyle={style}
                    keyExtractor={(item) => item.getStringId()}
                    keyboardShouldPersistTaps={'always'}
                    onScroll = {this._onScroll.bind(this)}
                    {...this.props.searchListProps}
                />
            </View>
        );
    };

    _renderBottomView = () => {
        return (
            <BottomBar
                {...this.props}
                selectedItems={this.state.selectedItems}
                onPress={this._clickOK}
                onPressItem={this._clickBottomItem}
            />
        );
    };

    _renderRow = ({item, isWeakNode, shadowItem}) => {
        return (
            <Cell
                {...this.props}
                isSearching={this.state.isSearching}
                treeNode={item}
                isWeakNode= {isWeakNode}
                shadowItem= {shadowItem}
                onPress={this._clickRow}
            />
        );
    };

    _renderHeader = () => {
        if (this.props.renderHeader) {
            return this.props.renderHeader(this.state.selectedItems);
        } else {
            return this._renderTitleLine();
        }
    };

    _renderTitleLine = () => {
        const {multilevel, showTitleLine} = this.props;
        return multilevel && showTitleLine ? (
            <TitleLine
                {...this.props}
                ref={ref => this.titleLineScrollView = ref}
                levelItems={this.state.levelItems}
                onPress={(index) => this._handlePressToPrevPage(index)}
            />
        ) : undefined;
    };

    _renderShowAll = (index) => {
        return (
            <ShowAllCell
                {...this.props}
                treeNode={index <= this.state.levelItems.length - 1 ? this.state.levelItems[index] : this.state.levelItems[this.state.levelItems.length - 1]}
                onPress={this._selectItem}
            />
        );
    };

    _renderPage = (index) => {
        const {split, sort, sectionListProps, flatListProps, showAllCell, customView, multilevel} = this.props;
        const treeNode = this.state.levelItems[index];
        const shadowItemNode = multilevel && this.state.shadowItems.length > index ? this.state.shadowItems[index] : undefined;
        let nodeArr, isSection;
        if (split) {
            isSection = true;
            nodeArr = split(treeNode.getChildren());
        } else {
            isSection = false;
            nodeArr = treeNode.getChildren();
            if (sort) {
                nodeArr = nodeArr.sort(sort);
            }
        }
        const style = multilevel && this.state.levelDeep > 1 ? {width: this.state.scrollPageWidth, borderRightWidth: StyleSheet.hairlineWidth,
            borderRightColor: '#e6e6ea',} : {width: this.state.scrollPageWidth};
        const ListClass = isSection ? SectionList : FlatList;
        const dataProps = isSection ? {sections: nodeArr} : {data: nodeArr};
        const ListProps = isSection ? sectionListProps : flatListProps;
        const hasShowAll = isCascade(this.props) && showAllCell;
        const wrapRenderRow = (...params)=>{
            const obj = params[0];
            const {item} = obj;
            let isWeakNode = false;
            if (item.getWeakParent().indexOf(treeNode) >= 0) {
                isWeakNode = true;
            }
            obj.isWeakNode = isWeakNode;
            obj.shadowItem = shadowItemNode;
            return this._renderRow(...params)
        }
        return (customView ? customView(nodeArr, wrapRenderRow) :
            <ListClass
                key={index}
                renderItem={wrapRenderRow}
                ListHeaderComponent={hasShowAll &&  this._renderShowAll(index)}
                style={[styles.listview, style, { height: '100%'}]}
                contentContainerStyle={style}
                keyExtractor={(item) => item.getStringId()}
                bounces = {false}
                {...dataProps}
                {...ListProps}
            />);
    };

    _renderEmptyPage = (index) => {
        return <View key={index} style={{width: this.state.scrollPageWidth}} />;
    };

    _renderPageView = () => {
        const deepth = this.state.levelItems.length;
        const totalWidth = this.state.scrollPageWidth * deepth;
        return (
            <ScrollView enable-flex={true} style={[styles.displayView, {width: this.state.screenWidth, position: 'relative', display: 'flex', flexDirection: 'column', height: 0}]} ref={(ref) => (this.pageScrollView = ref)} bounces={false} horizontal={true}>
                <View style={[{width: totalWidth}, styles.displayView, this.state.frame, { height: '100%', position: 'absolute', top:0, bottom: 0}]}>
                {
                    new Array(deepth).fill(1).map((item, index) => {
                        if (index < this.state.levelItems.length) {
                            return this._renderPage(index);
                        } else {
                            return this._renderEmptyPage(index);
                        }
                    })
                }
                </View>
            </ScrollView>
        );
    };

    getSelectedItems = () => {
        return [...this.state.selectedItems];
    };

    backToPreviousPage = () => {
        const curIndex = this.state.levelItems.length;
        if (curIndex <= 1) {
            return false;
        } else {
            this._handlePressToPrevPage(curIndex - 1);
            return true;
        }
    };

    _getCurrentSelectedIdKeys = (idKey = 'code') => {
        const { selectedItems } = this.state;
        let selectedCodes = [];
        let tmpSelectItems = [];
        if (selectedItems && selectedItems.length > 0) {
            tmpSelectItems = [[], ...selectedItems].reduce((prv, cur) => [...prv, ...cur.getLeafChildren()]);
            tmpSelectItems
                .filter((item) => item.isSelected == 1)
                .map((item) => {
                    if (selectedCodes.indexOf(item.root.info[idKey]) == -1) {
                        selectedCodes.push(item.root.info[idKey]);
                    }
                });
        }
        return selectedCodes;
    };

    _handlePressToPrevPage = (index) => {
        const levelItems = this.state.levelItems.slice(0, index);
        this._show(index - 1, levelItems);
    };

    _show = (index, levelItems) => {
        LayoutAnimation.easeInEaseOut();
        const shadowItems = this.props.multilevel && levelItems.length > 1 ? levelItems.slice(1) : [];
        this.setState({
            levelItems,
            frame: {
                top: 0,
                bottom: 0,
            },
            shadowItems,
        });

        if (!this.state.isSearching) {
            setTimeout(() => {
                this.pageScrollView.scrollTo && this.pageScrollView.scrollTo({
                    x: (index - 2 > 0 ? index - 2 : 0) * this.state.scrollPageWidth,
                    y: 0,
                    animated: true,
                });
            }, 200);
        }
    };

    _popToPrevious = () => {
        if (this.props.navigation && !this.hasPop) {
            this.hasPop = true;
            this.props.navigation.goBack();
        }
    };

    _clickBack = (index) => {
        if (index === 0 && !this.state.isSearching) {
            const curIndex = this.state.levelItems.length;
            if (curIndex <= 1 || !this.props.showTitleLine) {
                this._popToPrevious();
            } else {
                this._handlePressToPrevPage(curIndex - 1);
            }
        } else {
            this._popToPrevious();
        }
        this.props.onFinish && this.props.onFinish(this.state.selectedItems, true);
    };

    _clickOK = () => {
        this.props.onFinish && this.props.onFinish(this.state.selectedItems);
        this._popToPrevious();
    };

    _clickRow = (treeNode, isInternal = false) => {
        if (this.props.multilevel &&
            !isInternal &&
            !treeNode.isLeaf() &&
            !this.state.isSearching
        ) {
            const parentTreeNode = treeNode.getParent();
            let parentIndex = -1;
            for (var i = 0; i < this.state.levelItems.length; i++) {
                const item = this.state.levelItems[i];
                if (item.isEqual(parentTreeNode)) {
                    parentIndex = i+1;
                    break;
                }
            }
            if (parentIndex >= 0) {
                const levelItems = [...this.state.levelItems.slice(0, parentIndex), treeNode];
                this._show(levelItems.length, levelItems);
            }
        } else {
            if (this.props.selectable && !this.props.selectable(treeNode)){
                return;
            }
            if (this.props.multiselect) {
                this._selectItem(treeNode);
            } else {
                if (treeNode.isFullSelect(this.isCascade)) {
                    if (this.props.directBackWhenSingle &&
                        !this.props.cancelableWhenDirectBack) {
                        this._clickOK();
                    } else {
                        treeNode.update(this.isCascade);
                        const selectedItems = [];
                        this.setState({selectedItems}, () => {
                            if (this.props.directBackWhenSingle) {
                                this._clickOK();
                            }
                        });
                    }
                } else {
                    if (this.state.selectedItems.length > 0 &&
                        !this.state.selectedItems[0].isEqual(treeNode)) {
                        this.state.selectedItems[0].update(this.isCascade);
                    }
                    treeNode.update(this.isCascade);
                    const selectedItems = [treeNode];
                    this.setState({selectedItems}, () => {
                        if (this.props.directBackWhenSingle) {
                            this._clickOK();
                        }
                    });
                }
            }
        }
    };

    _clickBottomItem = (index) => {
        const node = this.state.selectedItems[index];
        node.update(this.isCascade);
        this._updateSelectedItems();
    };

    _onSubmit = (event) => {
        const text = event ? event.nativeEvent.text : this.state.searchText;
        this.setState({
            isSearching: true,
            searchText: text,
            scrollPageWidth: global.screenWidth(),
        });
    };

    _onSearch = (text) => {
        LayoutAnimation.linear();
        this.setState({
            isSearching: true,
            searchText: text,
            scrollPageWidth: global.screenWidth(),
        });
    };

    _selectItem = (item) => {
        item.update(this.isCascade);
        this._updateSelectedItems();
    };

    _getUpdateSelectedItems = (treeItem) => {
        let selectedItems =  treeItem.getChildren().reduce((prv, cur) => {
            return [...prv, ...cur.getFullSelectChildren(this.isCascade)];
        }, []);
        const selectedIncludeWeakItems = treeItem.getChildren().reduce((prv, cur) => {
            return [...prv, ...cur.getFullSelectChildren(this.isCascade, { includeWeakNode: true })];
        }, []);
        //加上无任何挂载的虚拟节点
        if (selectedItems.length !== selectedIncludeWeakItems.length) {
            const sa = new Set(selectedItems);
            const minus = selectedIncludeWeakItems.filter(fil => {
                !sa.has(fil) && treeItem.getChildren().reduce((prv, cur) => {
                    return prv || fil.hasAncestor(cur);
                }, false);
            });
            selectedItems = [...selectedItems, ...minus];
        }

        return selectedItems;
    }

    _updateSelectedItems = () => {
        const {levelItems, addedLevelItems} = this.state;
        let tmpSelectedItems = this._getUpdateSelectedItems(levelItems[0]);
        if (addedLevelItems && Array.isArray(addedLevelItems) && addedLevelItems.length > 0) {
            addedLevelItems.forEach(itemTree => {
                tmpSelectedItems = tmpSelectedItems.concat(this._getUpdateSelectedItems(itemTree));
            });
        }

        // 查重
        tmpSelectedItems = Array.from(new Set(tmpSelectedItems));

        let stateData = this.state.selectedItems;
        const endData = [];

        // 过滤掉已经可能取消选中的节点
        stateData = stateData.filter((item) => {
            if (tmpSelectedItems.indexOf(item) != -1) {
                return true;
            } else {
                return false;
            }
        })

        //  得到可能添加的节点
        tmpSelectedItems = tmpSelectedItems.filter((item) => {
            if (stateData.indexOf(item) != -1) {
                return true;
            } else {
                endData.push(item);
                return false;
            }
        })

        this.setState({ selectedItems: [...stateData, ...endData] });
    }

    _setSelectedItems = (idKey) => {
        try {
            const {levelItems, addedLevelItems} = this.state;
            let tmpSelectedItems = levelItems[0].setInitialState(idKey, this.isCascade);
            if (addedLevelItems && Array.isArray(addedLevelItems) && addedLevelItems.length > 0) {
                addedLevelItems.forEach(addedTree => {
                    tmpSelectedItems = tmpSelectedItems.concat(addedTree.setInitialState(idKey, this.isCascade));
                });
            }
            tmpSelectedItems && tmpSelectedItems.forEach(item => item.isSelected = 1);
            this.setState({selectedItems: tmpSelectedItems});
        } catch (e) {

        }
    }
}

const styles = StyleSheet.create({
    multiIcon: {
        width: 18,
        height: 18,
        borderRadius: 9
    },
    icon: {
        marginLeft: 4,
        width: 19,
        height: 22,
    },
    view: {
        flex: 1,
        overflow: 'hidden',
        backgroundColor: '#eff1f1',
    },
    leftButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    innersafeview: {
        flex: 1,
        backgroundColor: '#F7F7F9',
        height: 0
    },
    searchbarContainer: {
        flex: 0,
        backgroundColor: '#F7F7F9',
    },
    listview: {
        backgroundColor: 'transparent',
    },
    searchingViewContainer: {
        flex: 1,
        backgroundColor: '#eff1f1',
    },
    displayView: {
        flex: 1,
        flexDirection: 'row',
    },
    emptyImage: {
        marginTop: 100,
        alignSelf: 'center',
    },
});
