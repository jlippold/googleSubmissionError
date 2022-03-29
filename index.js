require('dotenv').config();

let { google } = require('googleapis');
const async = require('async');

var clientId = process.env.CLIENT_ID;
var secret = process.env.CLIENT_SECRET;
var accessToken = process.env.ACCESS_TOKEN;
var refreshToken = process.env.REFRESH_TOKEN;
var expiryDate = process.env.EXPIRY_DATE;
var assignments = require("./assignments");

var courseId = '388349836029';

const scopes = [
    'https://www.googleapis.com/auth/classroom.coursework.me',
    'https://www.googleapis.com/auth/classroom.push-notifications',
    'https://www.googleapis.com/auth/classroom.topics',
    'https://www.googleapis.com/auth/classroom.coursework.students',
    'https://www.googleapis.com/auth/classroom.student-submissions.students.readonly',
    'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly',
    'https://www.googleapis.com/auth/classroom.guardianlinks.me.readonly',
    'https://www.googleapis.com/auth/classroom.guardianlinks.students.readonly',
    'https://www.googleapis.com/auth/classroom.profile.photos',
    'https://www.googleapis.com/auth/classroom.profile.emails',
    'https://www.googleapis.com/auth/classroom.rosters',
    'https://www.googleapis.com/auth/classroom.courses',
];


function init() {
    
    createGoogleClient(function (err, client) {
        if (err) return console.error(err);
        let classroom = google.classroom({ version: 'v1', auth: client });
        async.eachOfLimit(assignments, 3, function(courseWorkId, index, nextAssignment) {
            console.log(`Starting ${courseWorkId}`);
            let nextPageToken = false;
            async.until(() => nextPageToken === undefined, (nextPage) => {
                let options = { courseId, courseWorkId };
                if ((typeof nextPageToken === 'string' || nextPageToken instanceof String)) {
                    options.pageToken = nextPageToken;
                }
                classroom.courses.courseWork.studentSubmissions.list(options, (err, googleResponse) => {
                    if (err) return nextPage(err);
                    if (googleResponse.data && googleResponse.data.studentSubmissions) {
                        if (googleResponse.data.hasOwnProperty('nextPageToken')) {
                            nextPageToken = googleResponse.data.nextPageToken;
                        } else {
                            nextPageToken = undefined;
                        }
                        nextPage();
                    } else {
                        //console.log("End of items");
                        nextPageToken = undefined; // no data
                        nextPage();
                    }
                });
            }, nextAssignment);
        }, function(err) {
            if (err) return console.error(err);
            console.log("fin");
        });
    });
}

function createGoogleClient(callback) {

    let oauth2Client = new google.auth.OAuth2(clientId, secret);
    oauth2Client.on('tokens', (tokens) => {
        accessToken = tokens.access_token;
        expiryDate = tokens.expiry_date;
    });

    oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
        scope: scopes.join(' '),
        token_type: 'Bearer',
        expiry_date: expiryDate,
    });
    return callback(null, oauth2Client);
}


init();