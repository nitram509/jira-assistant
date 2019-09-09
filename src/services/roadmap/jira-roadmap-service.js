export default class JiraRoadmapService {
    static dependencies = ["JiraService", "AjaxService", "CacheService", "MessageService", "SessionService"];

    constructor($jira, $ajax, $jaCache, $message, $session) {
        this.$jira = $jira;
        this.$ajax = $ajax;
        this.$jaCache = $jaCache;
        this.$message = $message;
        this.$session = $session;
    }

    /**
     * @typedef {Object} Resolution
     * @property {string} self
     * @property {string} name
     * @property {string} description
     * @property {string} id
     */

    /**
     * @typedef {Object} Assignee
     * @property {string} self
     * @property {string} name
     * @property {string} key
     * @property {string} emailAddress
     * @property {Object} avatarUrls
     * @property {string} displayName
     * @property {boolean} active
     * @property {string} timeZone
     */

    /**
     * @typedef {Object} StatusCategory
     * @property {string} self
     * @property {string} id
     * @property {string} key
     * @property {string} colorName
     * @property {string} name
     */

    /**
     * @typedef {Object} Status
     * @property {string} self
     * @property {string} id
     * @property {string} name
     * @property {string} description
     * @property {string} iconUrl
     * @property {StatusCategory} statusCategory
     */

    /**
     * @typedef {Object} JiraIssueFields
     * @property {Assignee} assignee
     * @property {string} issuetype
     * @property {Resolution} resolution
     * @property {Status} status
     * @property {string} summary
     */

    /**
     * @typedef {Object} JiraIssue
     * @property {string} id
     * @property {string} key
     * @property {string} self
     * @property {JiraIssueFields} fields
     */

    /**
     *
     * @param {boolean} forceRefresh
     * @returns {Promise<JiraIssue[]>|Promise<T[]>}
     */
    getRoadmapTickets(forceRefresh) {
        if (!forceRefresh) {
            const value = this.$jaCache.session.get("roadmapTickets");
            if (value) {
                return new Promise(resolve => resolve(value));
            }
        }
        return this.$jira.searchTickets("type = Story", ["id", "key", "issuetype", "summary", "assignee", "status", "resolution"])
            .then((result) => {
                this.$jaCache.session.set("roadmapTickets", result);
                return result;
            });
    }

}
