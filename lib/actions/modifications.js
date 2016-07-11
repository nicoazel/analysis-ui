import {createAction} from 'redux-actions'
import uuid from 'uuid'

import getFeedsRoutesAndStops from './get-feeds-routes-and-stops'
import {serverAction} from './network'
import {formatForServer} from '../utils/modification'

const deleteLocally = createAction('delete modification')
const deleteOnServer = (id) =>
  serverAction({
    url: `/api/modification/${id}`,
    options: {
      method: 'delete'
    }
  })
export const deleteModification = (id) => [deleteLocally(id), deleteOnServer(id)]

export const setActive = createAction('set active modification')
const setLocally = createAction('set modification')
const saveToServer = (m) =>
  serverAction({
    url: `/api/modification/${m.id}`,
    options: {
      body: JSON.stringify(formatForServer(m)),
      method: 'put'
    }
  })
export const set = (m) => [setActive(m), setLocally(m), saveToServer(m)]
export const setAndRetrieveData = ({
  bundleId,
  modification
}) => [set(modification), getFeedsRoutesAndStops({bundleId, modifications: [modification]})]
const setAll = createAction('set modifications')

export function getForScenario ({
  bundleId,
  scenarioId
}) {
  return serverAction({
    url: `/api/scenario/${scenarioId}/modifications`,
    next: async (response) => {
      const modifications = await response.json()
      return [
        setAll(modifications),
        getFeedsRoutesAndStops({
          bundleId,
          scenarioId,
          modifications
        })
      ]
    }
  })
}

export function copyFromScenario ({
  fromScenarioId,
  toScenarioId,
  variants
}) {
  return serverAction({
    url: `/api/scenario/${fromScenarioId}/modifications`,
    next: async (response) => {
      const modifications = await response.json()
      return modifications
        .map((modification) => {
          const newVariants = []

          for (let i = 0; i < variants.length; i++) {
            if (i < modification.variants.length) {
              newVariants.push(modification.variants[i])
            } else {
              newVariants.push(false)
            }
          }

          return set(Object.assign(modification, {
            id: uuid.v4(),
            scenario: toScenarioId,
            variants: newVariants
          }))
        })
    }
  })
}