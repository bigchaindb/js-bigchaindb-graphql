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
                outputs: { type: new GraphQLList(this.OutputType) }
            })
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
                    resolve(root, { asset_id, operation }) { // eslint-disable-line camelcase
                        return conn.listTransactions(asset_id, operation)
                    }
                },
                outputs: {
                    type: new GraphQLList(this.FulfillsType),
                    args: {
                        public_key: { type: GraphQLString },
                        spent: { type: GraphQLBoolean }
                    },
                    resolve(root, { public_key, spent }) { // eslint-disable-line camelcase
                        return conn.listOutputs(public_key, spent)
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
                        asset: { type: GraphQLString },
                        metadata: { type: GraphQLString }
                    },
                    resolve(root, {
                        publicKey, privateKey, asset, metadata
                    }) {
                        return conn.createTransaction(
                            publicKey,
                            privateKey,
                            JSON.parse(decodeURIComponent(asset)),
                            JSON.parse(decodeURIComponent(metadata))
                        )
                    }
                },
                transfer: {
                    type: this.TransactionType,
                    args: {
                        tx: { type: GraphQLString },
                        fromPublicKey: { type: GraphQLString },
                        fromPrivateKey: { type: GraphQLString },
                        toPublicKey: { type: GraphQLString },
                        metadata: { type: GraphQLString }
                    },
                    resolve(root, {
                        tx,
                        fromPublicKey,
                        fromPrivateKey,
                        toPublicKey,
                        metadata
                    }) {
                        return conn.transferTransaction(
                            JSON.parse(decodeURIComponent(tx)),
                            fromPublicKey,
                            fromPrivateKey,
                            toPublicKey,
                            JSON.parse(decodeURIComponent(metadata))
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
