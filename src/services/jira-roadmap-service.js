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
        return this.$jira.searchTickets("type = Story", ["id", "key", "issuetype", "summary", "assignee", "status", "resolution"])
            .then((result) => {
                this.$jaCache.session.set("roadmapTickets", result);
                return result;
            });
    }

    // {
    //     "expand": "operations,versionedRepresentations,editmeta,changelog,renderedFields",
    //     "id": "10022",
    //     "self": "http://localhost:9090/rest/api/2/issue/10022",
    //     "key": "SP-23",
    //     "fields": {
    //         "summary": "As a user, I'd like a historical story to show in reports",
    //         "issuetype": {
    //             "self": "http://localhost:9090/rest/api/2/issuetype/10002",
    //             "id": "10002",
    //             "description": "Created by Jira Software - do not edit or delete. Issue type for a user story.",
    //             "iconUrl": "http://localhost:9090/images/icons/issuetypes/story.svg",
    //             "name": "Story",
    //             "subtask": false
    //         },
    //         "assignee": {
    //             "self": "http://localhost:9090/rest/api/2/user?username=n",
    //             "name": "n",
    //             "key": "n",
    //             "emailAddress": "x.nitram509@gmail.com",
    //             "avatarUrls": {
    //                 "48x48": "https://www.gravatar.com/avatar/f7823eb96979f71aca9af6fbdf6300a0?d=mm&s=48",
    //                 "24x24": "https://www.gravatar.com/avatar/f7823eb96979f71aca9af6fbdf6300a0?d=mm&s=24",
    //                 "16x16": "https://www.gravatar.com/avatar/f7823eb96979f71aca9af6fbdf6300a0?d=mm&s=16",
    //                 "32x32": "https://www.gravatar.com/avatar/f7823eb96979f71aca9af6fbdf6300a0?d=mm&s=32"
    //             },
    //             "displayName": "x.nitram509@gmail.com",
    //             "active": true,
    //             "timeZone": "GMT"
    //         },
    //         "resolution": {
    //             "self": "http://localhost:9090/rest/api/2/resolution/10000",
    //             "id": "10000",
    //             "description": "Work has been completed on this issue.",
    //             "name": "Done"
    //         },
    //         "status": {
    //             "self": "http://localhost:9090/rest/api/2/status/10001",
    //             "description": "",
    //             "iconUrl": "http://localhost:9090/",
    //             "name": "Done",
    //             "id": "10001",
    //             "statusCategory": {
    //                 "self": "http://localhost:9090/rest/api/2/statuscategory/3",
    //                 "id": 3,
    //                 "key": "done",
    //                 "colorName": "green",
    //                 "name": "Done"
    //             }
    //         }
    //     }
    // }
}
