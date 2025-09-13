import { createQuery } from '../../middleware/operations.js'
import getUserUsageStats from '../../queries/getUserUsageStats.js'

export default createQuery(getUserUsageStats)
