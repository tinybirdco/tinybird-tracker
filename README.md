# Tinybird-tracker

A simple tracker in javascript to upload events directly from the browser to Tinybird.

# How it works

The tracker helps you record events in your HTML page and stores them in a Data Source within your Tinybird account. You can then explore this data in Real-time through Tinybird's SQL pipes and endpoints.

By default, the tracker stores along every event basic fields like:

* `timestamp (DateTime)` of the event
* `session_start (Datetime)` when the tracker is instantiated on a page
* `account_name (String)` with a name that can be passed on instantiation to better split events
* `user_id (String)`. An automatically generated uuid to track a given user through different pages. This ID is the only thing stored in a cookie
* `location (String)`. The URL of the page where the event takes place.
* `user_agent (String)`. The user_agent information for the particular browser

Additionally, as part of every event, you can pass along up to 8 additional attributes that will be stored in subsequent columns.

# Getting Started

## Create the Data source in Tinybird.

The tracker works by default with a 14 column data source called 'tracker'. It can be created with the following command:

```shell
curl \
-H "Authorization: Bearer <DATASOURCES:CREATE token>" \
-X POST "https://api.tinybird.co/v0/datasources?name=tracker&mode=create" \
-d "schema=timestamp DateTime,session_start DateTime,account_name String,user_id String,location String,user_agent String,attr_0 String,attr_1 String,attr_2 String,attr_3 String,attr_4 String, attr_5 String, attr_6 String, attr_7 String"
```

You can change the names and types of the 'attr_' columns in the schema to fit your needs. When issuing events, you are responsible to ensure those fields are used consitently.

## Instantiating the script

You will need to create an append token with permissions just with write permissions for the tracker Datasource, that you must include on instantiation, along side the account name you wish to use, the private variable name to use for the tracker and the Tinybird API HOST (which may vary for your account):

```html
<script>
(function(s,t,a,n,d,e,v){s[d]=s[d]||function(){(s[d].q=s[d].q||[]).push(arguments)};s[d].l=1*new Date();
e=t.createElement(a),v=t.getElementsByTagName(a)[0],e.async=1,e.src=n,v.parentNode.insertBefore(e,v);})
(window, document, 'script', 'https://cdn.tinybird.co/static/js/t.js?client=whatever', 'tbt');

tbt('init', '{{tracker_append_token}}') // ..., '{{account_name}}', '{{table_name}}', '{{api_host}}')
</script>
```

## Issuing events

Once the script is instantiated, you can call it by passing parameters to it. The following would be an example "page_load" that keeps track of the referrer as well as some other string (e.g. the nick for a specific landing page):

```javascript
tbt('send', 'pageload', document.referrer, 'landing_page_1')
```

The following would be an example to trigger "onclick":

```javascript
tbt('send', 'click', document.referrer, 'landing_page_1', 'sign-up button')
```


