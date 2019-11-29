/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable import/first */
// Some hackery to get WebSocket in the global namespace
// @todo: Find a nicer way to do this...
;(global as any).WebSocket = require('isomorphic-ws')

import { expect } from 'chai'
import { NewStoreReply } from '@textile/threads-client-grpc/api_pb'
import { WriteTransaction } from 'src/WriteTransaction'
import { Client } from '../index'

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
const client = new Client('http://localhost:9091')

const personSchema = {
  $id: 'https://example.com/person.schema.json',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Person',
  type: 'object',
  required: ['ID'],
  properties: {
    ID: {
      type: 'string',
      description: "The entity's id.",
    },
    firstName: {
      type: 'string',
      description: "The person's first name.",
    },
    lastName: {
      type: 'string',
      description: "The person's last name.",
    },
    age: {
      description: 'Age in years which must be equal to or greater than zero.',
      type: 'integer',
      minimum: 0,
    },
  },
}

interface Person {
  ID: string
  firstName: string
  lastName: string
  age: number
}

const createPerson = (): Person => {
  return {
    ID: '',
    firstName: 'Adam',
    lastName: 'Doe',
    age: 21,
  }
}

describe('Client', function() {
  let store: NewStoreReply.AsObject
  describe('.newStore', () => {
    it('response should be defined and have an id', async () => {
      store = await client.newStore()
      expect(store).to.not.be.undefined
      expect(store).to.haveOwnProperty('id')
      expect(store.id).to.not.be.undefined
    })
  })
  describe('.registerSchema', () => {
    it('response should be defined and be an empty object', async () => {
      const register = await client.registerSchema(store.id, 'Person', personSchema)
      expect(register).to.not.be.undefined
      // @todo: Is this really what we want this response to look like? Empty object?
      expect(register).to.be.empty
    })
  })
  describe('.start', () => {
    it('response should be defined and be an empty object', async () => {
      const start = await client.start(store.id)
      expect(start).to.not.be.undefined
      // @todo: Is this really what we want this response to look like? Empty object?
      expect(start).to.be.empty
    })
  })
  describe.skip('.startFromAddress', () => {
    it('response should be defined and be an empty object', async () => {
      const start = await client.startFromAddress(store.id, '', '', '')
      expect(start).to.not.be.undefined
      // @todo: Is this really what we want this response to look like? Empty object?
      expect(start).to.be.empty
    })
  })
  describe('.modelCreate', () => {
    it('response should contain a JSON parsable entitiesList', async () => {
      const create = await client.modelCreate(store.id, 'Person', [createPerson()])
      expect(create).to.not.be.undefined
      expect(create).to.haveOwnProperty('entitiesList')
      const entities = create.entitiesList.map(entity => JSON.parse(entity))
      expect(entities).to.have.nested.property('[0].firstName', 'Adam')
      expect(entities).to.have.nested.property('[0].lastName', 'Doe')
      expect(entities).to.have.nested.property('[0].age', 21)
      expect(entities).to.have.nested.property('[0].ID')
    })
  })
  describe('.modelSave', () => {
    it('response should be defined and be an empty object', async () => {
      const create = await client.modelCreate(store.id, 'Person', [createPerson()])
      const entities = create.entitiesList.map(entity => JSON.parse(entity))
      const person: Person = entities.pop()
      person.age = 30
      const save = await client.modelSave(store.id, 'Person', [person])
      expect(save).to.not.be.undefined
      // @todo: Is this really what we want this response to look like? Empty object?
      expect(save).to.be.empty
    })
  })
  describe('.modelDelete', () => {
    it('response should be defined and be an empty object', async () => {
      const create = await client.modelCreate(store.id, 'Person', [createPerson()])
      const entities = create.entitiesList.map(entity => JSON.parse(entity))
      const person: Person = entities.pop()
      const deleted = await client.modelDelete(store.id, 'Person', [person.ID])
      expect(deleted).to.not.be.undefined
      // @todo: Is this really what we want this response to look like? Empty object?
      expect(deleted).to.be.empty
    })
  })
  describe('.modelHas', () => {
    it('response be an object with property "exists" equal to true', async () => {
      const create = await client.modelCreate(store.id, 'Person', [createPerson()])
      const entities = create.entitiesList.map(entity => JSON.parse(entity))
      const person: Person = entities.pop()
      const has = await client.modelHas(store.id, 'Person', [person.ID])
      expect(has).to.not.be.undefined
      expect(has).to.have.property('exists', true)
    })
  })
  describe('.modelFindById', () => {
    it('response should contain a JSON parsable entity property', async () => {
      const create = await client.modelCreate(store.id, 'Person', [createPerson()])
      const entities = create.entitiesList.map(entity => JSON.parse(entity))
      const person: Person = entities.pop()
      const find = await client.modelFindByID(store.id, 'Person', person.ID)
      expect(find).to.not.be.undefined
      expect(find).to.haveOwnProperty('entity')
      const entity = JSON.parse(find.entity)
      expect(entity).to.not.be.undefined
      expect(entity).to.have.property('firstName', 'Adam')
      expect(entity).to.have.property('lastName', 'Doe')
      expect(entity).to.have.property('age', 21)
      expect(entity).to.have.property('ID')
    })
  })
  describe('.readTransaction', () => {
    let existingPerson: Person
    let transaction: WriteTransaction | undefined
    before(async () => {
      const create = await client.modelCreate(store.id, 'Person', [createPerson()])
      const entities = create.entitiesList.map(entity => JSON.parse(entity))
      existingPerson = entities.pop()
      transaction = client.writeTransaction(store.id, 'Person')
    })
    it('should start a transaction', async () => {
      expect(transaction).to.not.be.undefined
      await transaction!.start()
    })
    it('should able to check for an existing entity', async () => {
      const has = await transaction!.has([existingPerson.ID])
      expect(has).to.not.be.undefined
      expect(has).to.have.property('exists', true)
    })
    it('should be able to find an existing entity', async () => {
      const find = await transaction!.modelFindByID(existingPerson.ID)
      expect(find).to.not.be.undefined
      expect(find).to.haveOwnProperty('entity')
      const entity: Person = JSON.parse(find.entity)
      expect(entity).to.not.be.undefined
      expect(entity).to.have.property('firstName', 'Adam')
      expect(entity).to.have.property('lastName', 'Doe')
      expect(entity).to.have.property('age', 21)
      expect(entity).to.have.property('ID')
      expect(entity).to.deep.equal(existingPerson)
    })
    it('should be able to close/end an transaction', async () => {
      await transaction!.end()
    })
  })
  describe('.writeTransaction', () => {
    let existingPerson: Person
    let transaction: WriteTransaction | undefined
    before(async () => {
      const create = await client.modelCreate(store.id, 'Person', [createPerson()])
      const entities = create.entitiesList.map(entity => JSON.parse(entity))
      existingPerson = entities.pop()
      transaction = client.writeTransaction(store.id, 'Person')
    })
    it('should start a transaction', async () => {
      expect(transaction).to.not.be.undefined
      await transaction!.start()
    })
    it('should be able to create an entity', async () => {
      const newPerson = createPerson()
      const created = await transaction!.modelCreate([newPerson])
      expect(created).to.not.be.undefined
      expect(created).to.haveOwnProperty('entitiesList')
      const entities = created.entitiesList.map(entity => JSON.parse(entity))
      expect(entities).to.have.nested.property('[0].firstName', 'Adam')
      expect(entities).to.have.nested.property('[0].lastName', 'Doe')
      expect(entities).to.have.nested.property('[0].age', 21)
      expect(entities).to.have.nested.property('[0].ID')
    })
    it('should able to check for an existing entity', async () => {
      const has = await transaction!.has([existingPerson.ID])
      expect(has).to.not.be.undefined
      expect(has).to.have.property('exists', true)
    })
    it('should be able to find an existing entity', async () => {
      const find = await transaction!.modelFindByID(existingPerson.ID)
      expect(find).to.not.be.undefined
      expect(find).to.haveOwnProperty('entity')
      const entity: Person = JSON.parse(find.entity)
      expect(entity).to.not.be.undefined
      expect(entity).to.have.property('firstName', 'Adam')
      expect(entity).to.have.property('lastName', 'Doe')
      expect(entity).to.have.property('age', 21)
      expect(entity).to.have.property('ID')
      expect(entity).to.deep.equal(existingPerson)
    })
    it('should be able to save an existing entity', async () => {
      existingPerson.age = 99
      const saved = await transaction!.modelSave([existingPerson])
      expect(saved).to.not.be.undefined
      // @todo: Is this really what we want this response to look like? Empty object?
      expect(saved).to.be.empty
      const deleted = await transaction!.modelDelete([existingPerson.ID])
      expect(deleted).to.not.be.undefined
      // @todo: Is this really what we want this response to look like? Empty object?
      expect(deleted).to.be.empty
    })
    it('should be able to close/end an transaction', async () => {
      await transaction!.end()
    })
  })
  describe('.listen', () => {
    it('should stream responses.', async () => {
      const create = await client.modelCreate(store.id, 'Person', [createPerson()])
      const entities = create.entitiesList.map(entity => JSON.parse(entity))
      const existingPerson: Person = entities.pop()
      const events: number[] = []
      let closer: Function = () => {
        throw new Error('closer function not updated')
      }
      try {
        closer = client.listen(store.id, 'Person', existingPerson.ID, reply => {
          const entity = JSON.parse(reply.entity)
          expect(entity).to.not.be.undefined
          expect(entity).to.have.property('age')
          expect(entity.age).to.be.greaterThan(21)
          events.push(entity.age)
        })

        existingPerson.age = 30
        await client.modelSave(store.id, 'Person', [existingPerson])
        existingPerson.age = 40
        await client.modelSave(store.id, 'Person', [existingPerson])
        await sleep(1500)
        expect(events.length).to.equal(2)
      } finally {
        expect(closer()).to.not.throw
      }
    })
  })
})
