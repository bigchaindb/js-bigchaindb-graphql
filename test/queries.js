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
                blocks {
                    block {
                        node_pubkey
                        timestamp
                    }
                    votes {
                        node_pubkey
                        vote {
                            timestamp
                        }
                    }
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
                blocks {
                    block {
                        timestamp
                    }
                }
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
                    blocks {
                        block {
                            timestamp
                        }
                    }
                }
            }
        }
        `
}

function prepareQueryBlockList(transactionId) {
    return `
        {
            blocks(transaction_id: "${transactionId}") {
                id
                block {
                    timestamp
                }
                signature
            }
        }
        `
}

function prepareQueryBlock(blockId) {
    return `
        {
            block(id: "${blockId}") {
                id
                block {
                    timestamp
                    transactions {
                        id
                    }
                    node_pubkey
                    voters
                }
                votes {
                    vote {
                        timestamp
                    }
                }
                signature
            }
        }
        `
}

function prepareQueryVoteList(blockId) {
    return `
        {
            votes(block_id: "${blockId}") {
                node_pubkey
                signature
                vote {
                    voting_for_block
                    previous_block
                    is_block_valid
                    invalid_reason
                    timestamp
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

function prepareMutationTransaction(fromPublicKey, fromPrivateKey, payload, metadata) {
    return `
        mutation {
            transaction(
                publicKey: "${fromPublicKey}",
                privateKey: "${fromPrivateKey}",
                payload: "${payload}",
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
                blocks {
                    block {
                        node_pubkey
                        timestamp
                    }
                    votes {
                        node_pubkey
                        vote {
                            timestamp
                        }
                    }
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
                blocks {
                    block {
                        node_pubkey
                        timestamp
                    }
                    votes {
                        node_pubkey
                        vote {
                            timestamp
                        }
                    }
                }
            }
        }
        `
}


// create transaction
const transactionPayload = encodeURIComponent(JSON.stringify({ myassetdata: 'myassetvalue' }))
const transactionMetadata = encodeURIComponent(JSON.stringify({ mymetadata: 'mymetavalue' }))
const mutationTransaction = prepareMutationTransaction(
    aliceKeypair.publicKey,
    aliceKeypair.privateKey,
    transactionPayload,
    transactionMetadata
)
graphql(BigchainDBSchema, mutationTransaction).then(transaction => {
    console.log(JSON.stringify(transaction, null, 2))

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
        console.log(JSON.stringify(transfer, null, 2))

        const queryTransaction = prepareQueryTransaction(transaction.data.transaction.id)
        graphql(BigchainDBSchema, queryTransaction).then(result => {
            console.log(JSON.stringify(result, null, 2))
        })

        const queryTransactionList = prepareQueryTransactionList(transaction.data.transaction.id)
        graphql(BigchainDBSchema, queryTransactionList).then(transactionList => {
            console.log(JSON.stringify(transactionList, null, 2))
        })

        const queryOutputList = prepareQueryOutputList(bobKeypair.publicKey)
        graphql(BigchainDBSchema, queryOutputList).then(result => {
            console.log(JSON.stringify(result, null, 2))
        })

        const queryBlockList = prepareQueryBlockList(transaction.data.transaction.id)
        graphql(BigchainDBSchema, queryBlockList).then(blockList => {
            console.log(JSON.stringify(blockList, null, 2))

            const queryBlock = prepareQueryBlock(blockList.data.blocks[0].id)
            graphql(BigchainDBSchema, queryBlock).then(block => {
                console.log(JSON.stringify(block, null, 2))
            })

            const queryVoteList = prepareQueryVoteList(blockList.data.blocks[0].id)
            graphql(BigchainDBSchema, queryVoteList).then(result => {
                console.log(JSON.stringify(result, null, 2))
            })
        })

        const querySearch = prepareQuerySearch('myassetvalue')
        graphql(BigchainDBSchema, querySearch).then(queryResponse => {
            console.log(JSON.stringify(queryResponse, null, 2))
        })
    })
})
