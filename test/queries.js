import * as driver from 'bigchaindb-driver' // eslint-disable-line import/no-namespace
import bip39 from 'bip39'
import { graphql } from 'graphql'
import {
    BigchainDBGraphQLConnection,
    BigchainDBGraphQLSchema
} from '../src/index'

const BigchainDBSchema = new BigchainDBGraphQLSchema(
    new BigchainDBGraphQLConnection('http://localhost:9984/api/v1/')
).schema

const createKeypair = (seed) => new driver.Ed25519Keypair(seed.slice(0, 32))

// generate keypairs for Alice
const aliceMnemonic = bip39.generateMnemonic()
const aliceKeypair = createKeypair(bip39.mnemonicToSeed(aliceMnemonic))
// generate keypairs for Bob
const bobMnemonic = bip39.generateMnemonic()
const bobKeypair = createKeypair(bip39.mnemonicToSeed(bobMnemonic))

function prepareQueryTransaction(id) {
    return `
        {
            transaction(id: "${id}") {
                id
                operation
                asset
                metadata
                inputs {
                    owners_before
                    fulfillment
                    fulfills {
                        output_index
                        transaction {
                            id
                            asset
                            metadata
                            inputs {
                                fulfills {
                                    transaction {
                                        id
                                    }
                                }
                            }
                        }
                    }
                }
                outputs {
                    condition
                    public_keys
                    amount
                }
            }
        }
        `
}

function prepareQueryTransactionList(assetId) {
    return `
        {
            transactions(asset_id: "${assetId}") {
                id
                operation
            }
        }
        `
}

function prepareQueryOutputList(publicKey) {
    return `
        {
            outputs(public_key: "${publicKey}", spent: false) {
                output_index
                transaction {
                    id
                    metadata
                }
            }
        }
        `
}

function prepareQuerySearch(searchString) {
    return `
        {
            search(text: "${searchString}") {
                id
                asset
            }
        }
        `
}

function prepareMutationTransaction(fromPublicKey, fromPrivateKey, asset, metadata) {
    return `
        mutation {
            transaction(
                publicKey: "${fromPublicKey}",
                privateKey: "${fromPrivateKey}",
                asset: "${asset}",
                metadata: "${metadata}"
            ) {
                id
                operation
                asset
                metadata
                inputs {
                    owners_before
                    fulfillment
                    fulfills {
                        output_index
                        transaction {
                            id
                            asset
                            metadata
                            inputs {
                                fulfills {
                                    transaction {
                                        id
                                    }
                                }
                            }
                        }
                    }
                }
                outputs {
                    condition
                    public_keys
                    amount
                }
            }
        }
        `
}

function prepareTransferMutation(transaction, fromPublicKey, fromPrivateKey, toPublicKey, metadata) {
    return `
        mutation {
            transfer(
                tx: "${transaction}",
                fromPublicKey: "${fromPublicKey}",
                fromPrivateKey: "${fromPrivateKey}",
                toPublicKey: "${toPublicKey}",
                metadata: "${metadata}"
            ) {
                id
                operation
                asset
                metadata
                inputs {
                    owners_before
                    fulfillment
                    fulfills {
                        output_index
                        transaction {
                            id
                            asset
                            metadata
                            inputs {
                                fulfills {
                                    transaction {
                                        id
                                    }
                                }
                            }
                        }
                    }
                }
                outputs {
                    condition
                    public_keys
                    amount
                }
            }
        }
        `
}


// create transaction
const transactionAsset = encodeURIComponent(JSON.stringify({ myassetdata: 'myassetvalue' }))
const transactionMetadata = encodeURIComponent(JSON.stringify({ mymetadata: 'mymetavalue' }))
const mutationTransaction = prepareMutationTransaction(
    aliceKeypair.publicKey,
    aliceKeypair.privateKey,
    transactionAsset,
    transactionMetadata
)
graphql(BigchainDBSchema, mutationTransaction).then(transaction => {
    console.log("graphql 1", JSON.stringify(transaction.data.transaction.id, null, 2))

    // transfer created transaction
    const transactionData = encodeURIComponent(JSON.stringify(transaction.data.transaction))
    const transferMetadata = encodeURIComponent(JSON.stringify({ mymetadata: 'mymetavalue2' }))
    const mutationTransfer = prepareTransferMutation(
        transactionData,
        aliceKeypair.publicKey,
        aliceKeypair.privateKey,
        bobKeypair.publicKey,
        transferMetadata
    )
    graphql(BigchainDBSchema, mutationTransfer).then(transfer => {
        console.log("graphql 2", JSON.stringify(transfer, null, 2))

        const queryTransaction = prepareQueryTransaction(transaction.data.transaction.id)
        graphql(BigchainDBSchema, queryTransaction).then(result => {
            console.log("graphql 3", JSON.stringify(result, null, 2))
        })

        const queryTransactionList = prepareQueryTransactionList(transaction.data.transaction.id)
        graphql(BigchainDBSchema, queryTransactionList).then(transactionList => {
            console.log("graphql 4", JSON.stringify(transactionList, null, 2))
        })

        const queryOutputList = prepareQueryOutputList(bobKeypair.publicKey)
        graphql(BigchainDBSchema, queryOutputList).then(result => {
            console.log("graphql 5", JSON.stringify(result, null, 2))
        })

        const querySearch = prepareQuerySearch('myassetvalue')
        graphql(BigchainDBSchema, querySearch).then(queryResponse => {
            console.log("graphql 8", JSON.stringify(queryResponse, null, 2))
        })
    })
})
