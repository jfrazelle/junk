// Copyright 2012 Google Inc. All Rights Reserved.

/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Sample program traverses the Managemt API hierarchy to
 * retrieve the first profile id. This profile id is then used to query the
 * Core Reporting API to retrieve the top 25 organic
 * Note: auth_util.js is required for this to run.
 * @author api.nickm@gmail.com (Nick Mihailovski)
 */

/**
 * Executes a query to the Management API to retrieve all the users accounts.
 * Once complete, handleAccounts is executed. Note: A user must have gone
 * through the Google APIs authorization routine and the Google Anaytics
 * client library must be loaded before this function is called.
 */
function makeApiCall() {
    outputToPage('Querying Accounts.');
    gapi.client.analytics.management.accounts.list().execute(handleAccounts);
}


/**
 * Handles the API response for querying the accounts collection. This checks
 * to see if any error occurs as well as checks to make sure the user has
 * accounts. It then retrieve the ID of the first account and then executes
 * queryWebProeprties.
 * @param {Object} response The response object with data from the
 *     accounts collection.
 */
function handleAccounts(response) {
    if (!response.code) {
        if (response && response.items && response.items.length) {
            for(var i=0; i< response.items.length; i++){
                var account_id = response.items[i].id;
                queryWebproperties(account_id, i);
            }
        } else {
            updatePage('No accounts found for this user.')
        }
    } else {
        updatePage('There was an error querying accounts: ' + response.message);
    }
}


/**
 * Executes a query to the Management API to retrieve all the users
 * webproperties for the provided accountId. Once complete,
 * handleWebproperties is executed.
 * @param {String} accountId The ID of the account from which to retrieve
 *     webproperties.
 */
function queryWebproperties(accountId, i) {
    setTimeout(function(){
        updatePage('Querying Webproperties.');
        gapi.client.analytics.management.webproperties.list({
            'accountId': accountId
        }).execute(handleWebproperties);
    }, 5000*i);
}


/**
 * Handles the API response for querying the webproperties collection. This
 * checks to see if any error occurs as well as checks to make sure the user
 * has webproperties. It then retrieve the ID of both the account and the
 * first webproperty, then executes queryProfiles.
 * @param {Object} response The response object with data from the
 *     webproperties collection.
 */
function handleWebproperties(response) {
    if (!response.code) {
        if (response && response.items && response.items.length) {
            for(var i=0; i< response.items.length; i++){
                var account_id = response.items[i].accountId;
                var web_property_id = response.items[i].id;
                queryProfiles(account_id, web_property_id, i);
            }
        } else {
            updatePage('No webproperties found for this user.')
        }
    } else {
        updatePage('There was an error querying webproperties: ' + response.message);
    }
}


/**
 * Executes a query to the Management API to retrieve all the users
 * profiles for the provided accountId and webPropertyId. Once complete,
 * handleProfiles is executed.
 * @param {String} accountId The ID of the account from which to retrieve
 *     profiles.
 * @param {String} webpropertyId The ID of the webproperty from which to
 *     retrieve profiles.
 */
function queryProfiles(accountId, webpropertyId, i) {
    setTimeout(function(){
        updatePage('Querying Profiles.');
        gapi.client.analytics.management.profiles.list({
            'accountId': accountId,
            'webPropertyId': webpropertyId
        }).execute(handleProfiles);
    }, 5000*i);
}


/**
 * Handles the API response for querying the profiles collection. This
 * checks to see if any error occurs as well as checks to make sure the user
 * has profiles. It then retrieve the ID of the first profile and
 * finally executes queryCoreReportingApi.
 * @param {Object} response The response object with data from the
 *     profiles collection.
 */
function handleProfiles(response) {
    if (!response.code) {
        if (response && response.items && response.items.length) {
            for(var i=0; i< response.items.length; i++){
                var profile_id = response.items[i].id;
                queryCoreReportingApi(profile_id);
            }

        } else {
            updatePage('No profiles found for this user.')
        }
    } else {
        updatePage('There was an error querying profiles: ' + response.message);
    }
}


/**
 * Execute a query to the Core Reporting API to retrieve the top 25
 * organic search terms by visits for the profile specified by profileId.
 * Once complete, handleCoreReportingResults is executed.
 * @param {String} profileId The profileId specifying which profile to query.
 */
function queryCoreReportingApi(profileId) {
    updatePage('Querying Core Reporting API.');
    gapi.client.analytics.data.ga.get({
        'ids': 'ga:' + profileId,
        'start-date': lastNDays(14),
        'end-date': lastNDays(0),
        'metrics': 'ga:visits',
        'dimensions': 'ga:source,ga:keyword',
        'sort': '-ga:visits,ga:source',
        'filters': 'ga:medium==organic',
        'max-results': 25
    }).execute(handleCoreReportingResults);
}


/**
 * Handles the API reponse for querying the Core Reporting API. This first
 * checks if any errors occured and prints the error messages to the screen.
 * If sucessful, the profile name, headers, result table are printed for the
 * user.
 * @param {Object} response The reponse returned from the Core Reporting API.
 */
var headersDone = false;
var output = [];
function handleCoreReportingResults(response) {
    if (!response.code) {
        if (response.rows && response.rows.length) {
            resultsToPage('Adding Results for Profile Name: '+response.profileInfo.profileName+'...<br>');

            // Put headers in table.
            if (!headersDone){
                output.push('<table class="table table-condensed table-striped"><thead>');
                output.push('<tr>');
                output.push('<th>Profile Name</th>');
                for (var i = 0, header; header = response.columnHeaders[i]; ++i) {
                    output.push('<th>', header.name, '</th>');
                }
                headersDone = true;
                output.push('</tr></thead><tbody>');
            }            

            // Put cells in table.
            for (var i = 0, row; row = response.rows[i]; ++i) {
                output.push('<tr><td>'+response.profileInfo.profileName+'</td><td>', row.join('</td><td>'), '</td></tr>');
            }

            resultsToPage(output.join(''));
        } else {
            outputToPage('No results found.');
        }
    } else {
        updatePage('There was an error querying core reporting API: ' + response.message);
    }
}


/**
 * Utility method to update the output section of the HTML page. Used
 * to output messages to the user. This overwrites any existing content
 * in the output area.
 * @param {String} output The HTML string to output.
 */
function outputToPage(output) {
    document.getElementById('output').innerHTML = output;
}

function resultsToPage(output) {
    document.getElementById('output').innerHTML = '';
    document.getElementById('results').innerHTML = output + '</tbody></table>';
}


/**
 * Utility method to update the output section of the HTML page. Used
 * to output messages to the user. This appends content to any existing
 * content in the output area.
 * @param {String} output The HTML string to output.
 */
function updatePage(output) {
    document.getElementById('output').innerHTML += '<br>' + output;
}


/**
 * Utility method to return the lastNdays from today in the format yyyy-MM-dd.
 * @param {Number} n The number of days in the past from tpday that we should
 *     return a date. Value of 0 returns today.
 */
function lastNDays(n) {
    var today = new Date();
    var before = new Date();
    before.setDate(today.getDate() - n);

    var year = before.getFullYear();

    var month = before.getMonth() + 1;
    if (month < 10) {
        month = '0' + month;
    }

    var day = before.getDate();
    if (day < 10) {
        day = '0' + day;
    }

    return [year, month, day].join('-');
}


