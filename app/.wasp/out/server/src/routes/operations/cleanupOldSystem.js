import { createAction } from '../../middleware/operations.js'
import cleanupOldSystem from '../../actions/cleanupOldSystem.js'

export default createAction(cleanupOldSystem)
