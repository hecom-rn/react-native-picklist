import React from 'react';
import { DeviceEventEmitter, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PropTypes from 'prop-types';
import { FullSelect, NotSelect } from '@hecom/general-tree';
import Types from './Types';
import { isCascade } from './Util'
import Listener from '@hecom/listener';

export default class extends React.PureComponent {
    static propTypes = {
        ...Types,
        treeNode: PropTypes.object.isRequired,
        onPress: PropTypes.func.isRequired
    };

    constructor(props) {
        super(props);
        this.tree = props.treeNode;
        this.cascade = isCascade(props);
        this.state = {
            status: this.tree.selectStatus(this.cascade),
        };
    }

    componentDidMount() {
        this.listener = Listener.register(
            '__treenode__status__update__' + this.tree.getStringId(),
            this._refresh
        );
    }

    componentWillUnmount() {
        this.listener.remove();
    }

    shouldComponentUpdate(nextProps) {
        let changed = false;
        Object.keys(this.props).forEach((key) => {
            if (typeof this.props[key] === 'object') {
                try {
                    const raw = JSON.stringify(this.props[key]);
                    const next = JSON.stringify(nextProps[key]);
                    if (raw !== next) {
                        changed = true;
                    }
                } catch (err) {
                    changed = true;
                }
            } else if (nextProps[key] !== this.props[key]) {
                changed = true;
            }
        });
        if (changed) {
            this.tree = nextProps.treeNode;
            this.cascade = isCascade(nextProps);
            // this._refresh();
        }
        return changed;
    }

    render() {
        const {labels: {selectAll, deselectAll}, renderMultiSelectIcon, multilevel} = this.props;
        const isFull = this.tree.isFullSelect(this.cascade);
        const text = isFull ? deselectAll : selectAll;
        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => this.props.onPress(this.tree)}
            >
                <View style={multilevel ? [styles.view , { borderBottomWidth: 0}] : styles.view}>
                    <View style={styles.image}>
                        {renderMultiSelectIcon(isFull ? FullSelect : NotSelect)}
                    </View>
                    <Text style={styles.text}>
                        {text}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    }

    _refresh = () => {
        this.setState({
            status: this.tree.selectStatus(this.cascade),
        });
    };
}

const styles = StyleSheet.create({
    view: {
        backgroundColor: 'white',
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#e6e6ea',
    },
    image: {
        marginRight: 10,
        marginLeft: 25,
        marginTop: 10,
        marginBottom: 10,
    },
    text: {
        flex: 1,
        // marginVertical: 20,
        fontSize: 16,
        color: '#333333',
    },
});