
export default class JiraRoadmapService {
    static dependencies = ["JiraService", "AjaxService", "CacheService", "MessageService", "SessionService"];

    constructor($jira, $ajax, $jaCache, $message, $session) {
        this.$jira = $jira;
        this.$ajax = $ajax;
        this.$jaCache = $jaCache;
        this.$message = $message;
        this.$session = $session;
    }

    getRoadmapTickets(refresh) {
        if (!refresh) {
            const value = this.$jaCache.session.get("roadmapTickets");
            if (value) {
                return new Promise(resolve => resolve(value));
            }
        }
        return this.$jira.searchTickets("type = Story", ["*all"])
            .then((result) => { this.$jaCache.session.set("roadmapTickets", result); return result; });
    }

}
