import { createQuery } from '../../middleware/operations.js'
import getCacheStatistics from '../../queries/getCacheStatistics.js'

export default createQuery(getCacheStatistics)
