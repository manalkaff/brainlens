import { createAction } from '../../middleware/operations.js'
import cleanupCache from '../../actions/cleanupCache.js'

export default createAction(cleanupCache)
