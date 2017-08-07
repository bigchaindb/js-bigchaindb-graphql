import {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLList,
    GraphQLBoolean
} from 'graphql'
import GraphQLJSON from 'graphql-type-json'


export default class BigchainDBGraphQLSchema {
    constructor(conn) {
        this.FulfillsType = new GraphQLObjectType({
            name: 'Fulfills',
            fields: () => ({
                output_index: { type: GraphQLInt },
                transaction: {
                    type: this.TransactionType,
                    resolve(root) {
                        return conn.getTransaction(root.transaction_id)
                    }
                }
            })
        })

        this.InputType = new GraphQLObjectType({
            name: 'Input',
            fields: {
                owners_before: { type: new GraphQLList(GraphQLString) },
                fulfillment: { type: GraphQLString },
                fulfills: { type: this.FulfillsType }
            }
        })

        this.OutputType = new GraphQLObjectType({
            name: 'Output',
            fields: {
                condition: { type: GraphQLJSON },
                public_keys: { type: new GraphQLList(GraphQLString) },
                amount: { type: GraphQLString }
            }
        })

        this.TransactionType = new GraphQLObjectType({
            name: 'Transaction',
            fields: () => ({
                id: { type: GraphQLString },
                operation: { type: GraphQLString },
                version: { type: GraphQLString },
                asset: { type: GraphQLJSON },
                metadata: { type: GraphQLJSON },
                inputs: { type: new GraphQLList(this.InputType) },
                outputs: { type: new GraphQLList(this.OutputType) },
                blocks: {
                    type: new GraphQLList(this.BlockType),
                    resolve(root) {
                        return conn.listBlocks(root.id)
                    }
                }
            })
        })

        this.VoteType = new GraphQLObjectType({
            name: 'Vote',
            fields: {
                node_pubkey: { type: GraphQLString },
                signature: { type: GraphQLString },
                vote: {
                    type: new GraphQLObjectType({
                        name: 'VoteIntern',
                        fields: {
                            voting_for_block: { type: GraphQLString },
                            previous_block: { type: GraphQLString },
                            is_block_valid: { type: GraphQLBoolean },
                            invalid_reason: { type: GraphQLString },
                            timestamp: { type: GraphQLString }
                        }
                    })
                }
            }
        })

        this.BlockType = new GraphQLObjectType({
            name: 'Block',
            fields: {
                id: { type: GraphQLString },
                block: {
                    type: new GraphQLObjectType({
                        name: 'BlockIntern',
                        fields: {
                            timestamp: { type: GraphQLString },
                            transactions: { type: new GraphQLList(this.TransactionType) },
                            node_pubkey: { type: GraphQLString },
                            voters: { type: new GraphQLList(GraphQLString) },
                        }
                    })
                },
                votes: {
                    type: new GraphQLList(this.VoteType),
                    resolve(root) {
                        return conn.listVotes(root.id)
                    }
                },
                signature: { type: GraphQLString }
            }
        })

        this.queryType = new GraphQLObjectType({
            name: 'Query',
            fields: {
                transaction: {
                    type: this.TransactionType,
                    args: {
                        id: { type: GraphQLString }
                    },
                    resolve(root, { id }) {
                        return conn.getTransaction(id)
                    }
                },
                transactions: {
                    type: new GraphQLList(this.TransactionType),
                    args: {
                        asset_id: { type: GraphQLString },
                        operation: { type: GraphQLString }
                    },
                    resolve(root, { asset_id, operation }) {
                        return conn.listTransactions(asset_id, operation)
                    }
                },
                outputs: {
                    type: new GraphQLList(this.FulfillsType),
                    args: {
                        public_key: { type: GraphQLString },
                        spent: { type: GraphQLBoolean }
                    },
                    resolve(root, { public_key, spent }) {
                        return conn.listOutputs(public_key, spent)
                    }
                },
                block: {
                    type: this.BlockType,
                    args: {
                        id: { type: GraphQLString }
                    },
                    resolve(root, { id }) {
                        return conn.getBlock(id)
                    }
                },
                blocks: {
                    type: new GraphQLList(this.BlockType),
                    args: {
                        transaction_id: { type: GraphQLString },
                        status: { type: GraphQLString },
                    },
                    resolve(root, { transaction_id, status }) {
                        return conn.listBlocks(transaction_id, status)
                    }
                },
                votes: {
                    type: new GraphQLList(this.VoteType),
                    args: {
                        block_id: { type: GraphQLString },
                    },
                    resolve(root, { block_id }) {
                        return conn.listVotes(block_id)
                    }
                },
                search: {
                    type: new GraphQLList(this.TransactionType),
                    args: {
                        text: { type: GraphQLString }
                    },
                    resolve(root, { text }) {
                        return conn.searchAssets(text)
                    }
                }
            }
        })

        this.mutationType = new GraphQLObjectType({
            name: 'Mutation',
            fields: {
                transaction: {
                    type: this.TransactionType,
                    args: {
                        publicKey: { type: GraphQLString },
                        privateKey: { type: GraphQLString },
                        payload: { type: GraphQLJSON },
                        metadata: { type: GraphQLJSON }
                    },
                    resolve(root, { publicKey, privateKey, payload, metadata }) {
                        return conn.publishTransaction(publicKey, privateKey, payload, metadata)
                    }
                },
                transfer: {
                    type: this.TransactionType,
                    args: {
                        tx: { type: GraphQLJSON },
                        fromPublicKey: { type: GraphQLString },
                        fromPrivateKey: { type: GraphQLString },
                        toPublicKey: { type: GraphQLString },
                        metadata: { type: GraphQLJSON }
                    },
                    resolve(root, {
                        tx,
                        fromPublicKey,
                        fromPrivateKey,
                        toPublicKey,
                        metadata }
                    ) {
                        return conn.transferTransaction(
                            tx,
                            fromPublicKey,
                            fromPrivateKey,
                            toPublicKey,
                            metadata
                        )
                    }
                }
            }
        })

        this.schema = new GraphQLSchema({
            query: this.queryType,
            mutation: this.mutationType,
            types: [this.TransactionType],
        })
    }
}
