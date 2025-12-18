import PropTypes from 'prop-types';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import Types from './Types';

export default class extends React.PureComponent {
    static propTypes = {
        ...Types,
        selectedItems: PropTypes.array.isRequired,
        onPress: PropTypes.func.isRequired,
        onPressItem: PropTypes.func.isRequired,
    };

    componentDidUpdate(prevProps) {
        if (prevProps.selectedItems.length !== this.props.selectedItems.length) {
            setTimeout(() => {
                this.scrollView && this.scrollView.scrollToEnd({animated: false});
            }, 0);
        }
    }

    render() {
        const {selectedItems} = this.props;
        return (
            <SafeAreaInsetsContext.Consumer>
                {insets => (
                    <View style={[{paddingBottom: insets?.bottom}, styles.view]}>
                        <ScrollView
                            ref={ref => this.scrollView = ref}
                            horizontal={true}
                            showsHorizontalScrollIndicator={false}
                            scrollEnabled={selectedItems.length > 0}
                            contentContainerStyle={styles.content}
                        >
                            {selectedItems.length > 0
                                ? selectedItems.map(this._renderItem)
                                : this._renderEmpty()}
                        </ScrollView>
                        {this._renderButton()}
                    </View>
                )}
            </SafeAreaInsetsContext.Consumer>
            
        );
    }

    _renderButton = () => {
        const {onPress, selectedItems} = this.props;
        const prefixTestID = this.props.prefixTestID || '';
        const selectedCount = (selectedItems && selectedItems.length > 0) ? ('(' + selectedItems.length + ')') : '';
        return (
            <View style={styles.buttonView}>
                <TouchableOpacity style={styles.buttonTouch} onPress={onPress} testID={`${prefixTestID}${this.props.labels.ok}`}>
                    <Text style={styles.buttonText}>
                        {this.props.labels.ok + selectedCount}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    _renderItem = (node, index) => {
        const {onPressItem, labelKey} = this.props;
        return (
            <TouchableOpacity
                key={index}
                style={styles.itemTouch}
                onPress={() => onPressItem(index)}
            >
                <Text style={styles.itemText}>
                    {node.getInfo()[labelKey]}
                </Text>
            </TouchableOpacity>
        );
    };

    _renderEmpty = () => {
        return (
            <View style={styles.emptyView}>
                <Text style={styles.emptyText}>
                    {this.props.labels.choose}
                </Text>
            </View>
        );
    };
}

const styles = StyleSheet.create({
    view: {
        flex: 0,
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#e6e6ea',
    },
    content: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemTouch: {
        paddingLeft: 6,
        paddingRight: 6,
        height: 30,
        marginLeft: 4,
        marginRight: 4,
        borderRadius: 4,
        backgroundColor: 'white',
        minWidth: 36,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#e6e8ea',
    },
    itemText: {
        fontSize: 12,
        color: '#333333'
    },
    emptyView: {
        paddingLeft: 4,
        paddingRight: 4,
        minHeight: 20,
        marginLeft: 5,
        marginRight: 5,
        borderRadius: 4,
        backgroundColor: 'white',
        minWidth: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: '#999999'
    },
    buttonView: {
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
        marginRight: 10,
    },
    buttonTouch: {
        paddingLeft: 4,
        paddingRight: 4,
        height: 30,
        borderRadius: 2,
        backgroundColor: '#FF3840',
        minWidth: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 14,
        color: '#ffffff'
    },
});
