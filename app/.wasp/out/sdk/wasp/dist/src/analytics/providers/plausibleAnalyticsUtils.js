const PLAUSIBLE_API_KEY = process.env.PLAUSIBLE_API_KEY;
const PLAUSIBLE_SITE_ID = process.env.PLAUSIBLE_SITE_ID;
const PLAUSIBLE_BASE_URL = process.env.PLAUSIBLE_BASE_URL;
// Helper function to check if Plausible is properly configured
function isPlausibleConfigured() {
    return !!(PLAUSIBLE_API_KEY &&
        !PLAUSIBLE_API_KEY.includes('...') &&
        PLAUSIBLE_SITE_ID &&
        !PLAUSIBLE_SITE_ID.includes('localhost') &&
        PLAUSIBLE_BASE_URL &&
        PLAUSIBLE_BASE_URL !== 'undefined');
}
const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${PLAUSIBLE_API_KEY}`,
};
export async function getDailyPageViews() {
    // If Plausible is not properly configured, return default values
    if (!isPlausibleConfigured()) {
        console.log('Plausible not configured, returning default analytics values');
        return {
            totalViews: 0,
            prevDayViewsChangePercent: '0',
        };
    }
    const totalViews = await getTotalPageViews();
    const prevDayViewsChangePercent = await getPrevDayViewsChangePercent();
    return {
        totalViews,
        prevDayViewsChangePercent,
    };
}
async function getTotalPageViews() {
    const response = await fetch(`${PLAUSIBLE_BASE_URL}/v1/stats/aggregate?site_id=${PLAUSIBLE_SITE_ID}&metrics=pageviews`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${PLAUSIBLE_API_KEY}`,
        },
    });
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const json = (await response.json());
    return json.results.pageviews.value;
}
async function getPrevDayViewsChangePercent() {
    // Calculate today, yesterday, and the day before yesterday's dates
    const today = new Date();
    const yesterday = new Date(today.setDate(today.getDate() - 1)).toISOString().split('T')[0];
    const dayBeforeYesterday = new Date(new Date().setDate(new Date().getDate() - 2)).toISOString().split('T')[0];
    // Fetch page views for yesterday and the day before yesterday
    const pageViewsYesterday = await getPageviewsForDate(yesterday);
    const pageViewsDayBeforeYesterday = await getPageviewsForDate(dayBeforeYesterday);
    console.table({
        pageViewsYesterday,
        pageViewsDayBeforeYesterday,
        typeY: typeof pageViewsYesterday,
        typeDBY: typeof pageViewsDayBeforeYesterday,
    });
    let change = 0;
    if (pageViewsYesterday === 0 || pageViewsDayBeforeYesterday === 0) {
        return '0';
    }
    else {
        change = ((pageViewsYesterday - pageViewsDayBeforeYesterday) / pageViewsDayBeforeYesterday) * 100;
    }
    return change.toFixed(0);
}
async function getPageviewsForDate(date) {
    const url = `${PLAUSIBLE_BASE_URL}/v1/stats/aggregate?site_id=${PLAUSIBLE_SITE_ID}&period=day&date=${date}&metrics=pageviews`;
    const response = await fetch(url, {
        method: 'GET',
        headers: headers,
    });
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = (await response.json());
    return data.results.pageviews.value;
}
export async function getSources() {
    // If Plausible is not properly configured, return empty sources
    if (!isPlausibleConfigured()) {
        console.log('Plausible not configured, returning empty sources');
        return [];
    }
    const url = `${PLAUSIBLE_BASE_URL}/v1/stats/breakdown?site_id=${PLAUSIBLE_SITE_ID}&property=visit:source&metrics=visitors`;
    const response = await fetch(url, {
        method: 'GET',
        headers: headers,
    });
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = (await response.json());
    return data.results;
}
//# sourceMappingURL=plausibleAnalyticsUtils.js.map