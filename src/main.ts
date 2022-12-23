import * as core from '@actions/core';
import axios from "axios";
import _ from "lodash";
import { makeContents } from "./make";

async function run(): Promise<void> {
    try {
        const pageId = core.getInput('pageId')
        const pageTitle = core.getInput('pageTitle')
        const contentsJson = core.getInput('contentsJson')
        const appendContents = core.getInput('appendContents')
        const jiraAuth = process.env.JIRA_AUTH;
        const jiraUrl = process.env.JIRA_URL;

        core.debug(`pageId: ${pageId}`)
        core.debug(`pageTitle: ${pageTitle}`)
        core.debug(`contentsJson: ${contentsJson}`)
        core.debug(`jiraAuth: ${jiraAuth}`)
        core.debug(`jiraUrl: ${jiraUrl}`)

        if(_.isEmpty(pageId) || _.isEmpty(jiraAuth) || _.isEmpty(jiraUrl)) {
            console.log('Check Value');
            return;
        }
        const currentPage = await axios.get(`${jiraUrl}/wiki/rest/api/content/${pageId}?expand=body.storage,version`, {
            headers: {
                "Authorization": `Basic ${jiraAuth}`
            }
        });
        const version = _.get(currentPage.data, 'version.number', '');
        const prevContents = _.get(currentPage.data, 'body.storage.value', '');
        const newContents = makeContents(contentsJson);
        if(appendContents) {
            newContents = prevContents + newContents;
        }
        await axios.put(`${jiraUrl}/wiki/rest/api/content/${pageId}`, {
            "version": {
                "number": _.toInteger(version) + 1
            },
            "title": pageTitle,
            "type": "page",
            "body": {
                "storage": {
                    "value": `${makeContents(contentsJson)}`,
                    "representation": "storage"
                }
            }
        }, {
            headers: {
                "Authorization": `Basic ${jiraAuth}`
            }
        })

    } catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        }
    }
}

run();
