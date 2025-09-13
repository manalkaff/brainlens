import { createAction } from '../../middleware/operations.js'
import createTopic from '../../actions/createTopic.js'

export default createAction(createTopic)
