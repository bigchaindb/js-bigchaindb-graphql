import { graphql } from 'graphql'
import {
    BigchainDBGraphQLConnection,
    BigchainDBGraphQLSchema
} from '../src/index'

const BigchainDBSchema = new BigchainDBGraphQLSchema(
    new BigchainDBGraphQLConnection('http://localhost:9984/api/v1/')
).schema

const queryTransaction = `
{
    transaction(id: "467d446c3ce847c0c8d18174af59ff3a37452c87a43af2fc155367731993a8a9") {
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

const queryTransactionList = `
{
    transactions(asset_id: "3b86a8e52a646ea8c16ed13dd3930945eb8e530769336eea6cbabedc9a89220d") {
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

const queryOutputList = `
{
    outputs(public_key: "8A9M3gSWyvfPVAFnFbvXCqKgzjri5ASGnFRsS89kBiJD", spent: false) {
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

const queryBlock = `
{
    block(id: "c44c06985175ee0cf210fff65c44e63aa06300999e5e7654e13678582522e8f0") {
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

const queryBlockList = `
{
    blocks(transaction_id: "3b86a8e52a646ea8c16ed13dd3930945eb8e530769336eea6cbabedc9a89220d") {
        id
        block {
            timestamp
        }
        signature
    } 
}
`

const queryVoteList = `
{
    votes(block_id: "c44c06985175ee0cf210fff65c44e63aa06300999e5e7654e13678582522e8f0") {
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

const querySearch = `
{
    search(text: "FlexPen") {
        id
        asset
    } 
}
`

graphql(BigchainDBSchema, queryTransaction).then(result => {
    console.log(JSON.stringify(result, null, 2))
})
graphql(BigchainDBSchema, queryTransactionList).then(result => {
    console.log(JSON.stringify(result, null, 2))
})
graphql(BigchainDBSchema, queryOutputList).then(result => {
    console.log(JSON.stringify(result, null, 2))
})
graphql(BigchainDBSchema, queryBlock).then(result => {
    console.log(JSON.stringify(result, null, 2))
})
graphql(BigchainDBSchema, queryBlockList).then(result => {
    console.log(JSON.stringify(result, null, 2))
})
graphql(BigchainDBSchema, queryVoteList).then(result => {
    console.log(JSON.stringify(result, null, 2))
})
graphql(BigchainDBSchema, querySearch).then(result => {
    console.log(JSON.stringify(result, null, 2))
})
