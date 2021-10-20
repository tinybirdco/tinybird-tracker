# Tinybird-tracker

A simple tracker in JavaScript to upload events directly from the browser to Tinybird.

# How it works

The tracker helps you record events in your HTML page and stores them in a Data Source within your Tinybird account. You can then explore this data in realtime through Tinybird's SQL pipes and endpoints.

By default, the tracker stores along every event basic fields like:

* `timestamp (DateTime)` of the event
* `session_start (Datetime)` when the tracker was instantiated on a page
* `event (String)` with a name that can be passed on instantiation to better split events
* `uuid (String)`. An automatically generated uuid to track a given user through different pages. This ID is the only thing stored in a cookie

Additionally, as part of every event, you can pass along any attribe in JSON format.

# Getting Started

## Create the Data source in Tinybird.

You need a Data Source created with a NDJSON schema (remember to choose a Data Source name). It can be created with the following command:

```shell
curl \
-H "Authorization: Bearer <DATASOURCES:CREATE token>" \
-X POST -G -d 'mode=create' -d 'format=ndjson' -d 'name=events' --data-urlencode 'schema=timestamp DateTime `json:$.timestamp`, event String `json:$.event`, session_start String `json:$.session_start`, uuid String `json:$.uuid`' https://api.tinybird.co/v0/datasources
```

You can change the names and types of the columns in the schema to fit your needs. When issuing events, you can send as many attributes as you want, no matter if there isn't an specific column for them.

## Instantiating the script

You will need to create an append token with permissions just with write permissions for the tracker Data Source, that you must include on instantiation:

```html
<script data-token="YOUR_TOKEN" data-source="events" src="https://cdn.tinybird.co/static/js/t.js"></script>
```

Here it is the list of available options for the script:

| Name          | Default value             | Description |
| ------------- | ------------------------- | ------------- |
| token         |                           | Token write permissions over the Data Source |
| source        |                           | Data Source name in Tinybird |
| api           | https://api.tinybird.co   | API URL origin. Optional |

In order to use them, add them as data attributes (`data-xxxx`) in the script instantation.


## Issuing events

Once the script is loaded in the DOM, you can start sending events with the `tinybird` object.
It accepts two parameters, the first one is the event name, and the second one, the rest of the attributes you want to stre.

This is an example of storing an event of `pageload` which will be triggered once the script is loaded:

```html
<script>
  tinybird('pageload', { referrer: document.referrer, page: 'landing_page_1' })
</script>
```

The following would be an example to trigger "onclick":

```javascript
tbt.push('click', { 
  referrer: document.referrer,
  page: 'landing_page_1',
  place: 'sign-up button'
})
```


