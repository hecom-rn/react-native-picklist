import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FullSelect, IncompleteSelect, NotSelect } from '@hecom/general-tree';
import ArrowImage from '@hecom/image-arrow';
import { isCascade } from './Util';

export default (treeNode, props) => props.multilevel ? multiLevelNode(treeNode, props) : singleLevelNode(treeNode, props);

export const singleLevelNode = (treeNode, props) => {
    const {labelKey, numberOfTextLines, renderSingleSelectIcon} = props;
    const isSelected = treeNode.isFullSelect(false);
    return (
        <View style={styles.row}>
            <View style={styles.container}>
                <Text testID={`select_${treeNode.getInfo()[labelKey]}`} style={styles.text} numberOfLines={numberOfTextLines}>
                    {treeNode.getInfo()[labelKey]}
                </Text>
                {isSelected ? renderSingleSelectIcon() : <View style={styles.icon} />}
            </View>
        </View>
    );
};

export const multiLevelNode = (treeNode, props) => {
    return treeNode.isLeaf() ? multiLevelLeafNode(treeNode, props) : multiLevelNotLeafNode(treeNode, props);
};

export const multiLevelLeafNode = (treeNode, props) => {
    const selectState = getSelectState(treeNode, isCascade(props), false);
    const {labelKey, numberOfTextLines, renderMultiSelectIcon, weakNodeTag, multilevel, isSearching, showRegularCount, regularCountKey, showSearchLeafNodeParentName} = props;
    const info = treeNode.getInfo()[labelKey];
    const selectable = props.selectable ? props.selectable(treeNode) : true;
    const searchParentName = showSearchLeafNodeParentName ? treeNode?.getParent()?.getInfo()?.[labelKey] : undefined;
    const regularCount = treeNode.getInfo()[regularCountKey];
    const arrowStyle = {marginLeft: 0, width: 13, height: 16};
    return (
        <View key={info} style={multilevel && !isSearching ? [styles.leafContainer , { borderBottomWidth: 0, justifyContent: showRegularCount ? 'space-around' : 'flex-start'}] : [styles.leafContainer, {justifyContent: showRegularCount ? 'space-around' : 'flex-start'}]}>
            {selectable &&
                <View testID={`SelectIcon_${info}`} style={styles.cellSelected}>
                    {renderMultiSelectIcon(selectState)}
                </View>
            }
            <View style={[styles.textContainer, {marginLeft: selectable ? 0 : 25}]}>
                <Text style={styles.leafText} numberOfLines={numberOfTextLines} testID={`SelectText_${info}`}>
                    {isSearching && searchParentName ? `${info}(${searchParentName})` : info}
                </Text>
                {props.isWeakNode && (
                    weakNodeTag ? weakNodeTag() :
                    <View style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: '#1890FF',
                        marginLeft: 10,
                    }} />)
                }
            </View>
            {showRegularCount && (<View style={[styles.treeCellRight]}>
                <Text style={styles.treeCellCount}>
                    {regularCount.toString()}
                </Text>
                <View style={arrowStyle} />
            </View>)}
        </View>
    );
};

export const multiLevelNotLeafNode = (treeNode, props) => {
    const selectState = getSelectState(treeNode, isCascade(props), false);
    const showShadowState = getShadowState(treeNode, props);
    const {onPress, labelKey, showCount, numberOfTextLines, renderMultiSelectIcon, multilevel, isSearching, showRegularCount, regularCountKey} = props;
    const selectable = props.selectable ? props.selectable(treeNode) : true;
    const info = treeNode.getInfo()[labelKey];
    const leafCount = treeNode.getLeafCount();
    const regularCount = treeNode.getInfo()[regularCountKey];
    const selectedLeafCount = treeNode.getSelectedLeafCount({includeWeakNode: true});
    const arrowStyle = showCount || showRegularCount ? {marginLeft: 0} : {marginLeft: 10};
    return (
        <View key={info} style={[multilevel && !isSearching ? [styles.treeCellContainer , { borderBottomWidth: 0}] : styles.treeCellContainer, showShadowState ? {backgroundColor: '#F7F7F9'} : {backgroundColor: 'white'}]}>
            <View style={styles.treeCellLeft}>
                {selectable && (
                    <TouchableOpacity onPress={() => onPress(treeNode, true)}>
                        <View
                            testID={`SelectIcon_${info}`}
                            style={styles.cellSelected}>{renderMultiSelectIcon(selectState)}
                        </View>
                    </TouchableOpacity>
                )}
                <Text
                    style={[styles.treeCellText, {marginLeft: selectable ? 0 : 25}]}
                    numberOfLines={numberOfTextLines}
                    testID={`SelectText_${info}`}
                >
                    {info}
                </Text>
            </View>
            <View style={styles.treeCellRight}>
                {showCount && (
                    <Text style={styles.treeCellCount}>
                        {[selectedLeafCount.toString(), leafCount.toString()].join('/')}
                    </Text>
                )}
                {showRegularCount && (
                    <Text style={styles.treeCellCount}>
                        {regularCount.toString()}
                    </Text>
                )}
                <ArrowImage style={arrowStyle} />
            </View>
        </View>
    );
};

export const notselect_image = () => require('./image/checkbox.png');
export const select_image = () => require('./image/checkbox_hl.png');
export const incomp_image = () => require('./image/checkbox_noall.png');
export const single_check_image = () => require('./image/single_check.png');

export const getImage = (selectState) => {
    switch (selectState) {
        case NotSelect:
            return notselect_image();
        case FullSelect:
            return select_image();
        case IncompleteSelect:
            return incomp_image();
        default:
            return undefined;
    }
};

export const getSelectState = (treeNode, cascade, multiselect = true) => {
    if (treeNode.isNotSelect(cascade, multiselect)) {
        return NotSelect;
    } else if (treeNode.isFullSelect(cascade, multiselect)) {
        return FullSelect;
    } else if (treeNode.isIncompleteSelect(cascade, multiselect)) {
        return IncompleteSelect;
    } else {
        return undefined;
    }
};

export const getShadowState = (treeNode, {shadowItem}) => {
    if (shadowItem && shadowItem !== undefined && treeNode.root.path === shadowItem.root.path) {
        return true;
    }
    return false;
}


const styles = StyleSheet.create({
    row: {
        backgroundColor: 'white',
        paddingLeft: 15,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingRight: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#e6e6ea',
    },
    text: {
        flex: 1,
        fontSize: 16,
        color: '#333333',
    },
    icon: {
        marginLeft: 4,
        width: 19,
        height: 22,
    },
    cellSelected: {
        marginRight: 10,
        marginLeft: 25,
        marginTop: 10,
        marginBottom: 10,
    },
    leafText: {
        marginVertical: 20,
        fontSize: 16,
        color: '#333333',
    },
    treeCellContainer: {
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#e6e6ea',
    },
    leafContainer: {
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#e6e6ea',
    },
    textContainer: {
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    treeCellLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    treeCellText: {
        flex: 1,
        marginVertical: 16,
        fontSize: 16,
        color: '#333333',
    },
    treeCellRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    treeCellCount: {
        fontSize: 16,
        color: '#999999',
        marginHorizontal: 4,
    },
});
