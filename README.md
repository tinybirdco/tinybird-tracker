# DEPRECATED: tinybird-tracker [![No Maintenance Intended](http://unmaintained.tech/badge.svg)](http://unmaintained.tech/)

⛔️ This is no longer supported, please consider using [web-analytics-starter-kit](https://github.com/tinybirdco/web-analytics-starter-kit) instead ⛔️

A simple tracker in JavaScript to upload events directly from the browser to [Tinybird](https://www.tinybird.co).

## How it works

The tracker helps you record events in your HTML page and stores them in a Data Source within your Tinybird account. You can then explore this data in realtime through Tinybird's SQL pipes and endpoints.

By default, the tracker stores along every event basic fields like:

* `timestamp (DateTime)` of the event
* `session_start (Datetime)` when the tracker was instantiated on a page
* `event (String)` with a name that can be passed on instantiation to better split events
* `uuid (String)`. An automatically generated uuid to track a given user through different pages. This ID is the only thing stored in a cookie

Additionally, as part of every event, you can pass along any attribute in JSON format.

## Getting Started

### Prerequisite - Creating the Data Source

Before sending any event to Tinybird, you will need a [Data Source](https://docs.tinybird.co/main-concepts.html) to store those events.

The best way to create a Data Source to use along with Tinybird-tracker is via API. The Data Source has to contain a certain set of default columns for the data we send by default and you can add your columns for the custom data you want to track.

The default properties we send are:

| Property      | Type     | Description                                           |
|---------------|----------|-------------------------------------------------------|
| event         | String   | The name of the event                                 |
| timestamp     | DateTime | Timestamp of the event                                |
| session_start | DateTime | Timestamp when the tracker was instantiated on a page |
| uuid          | String   | An automatically generated uuid to track a given user through different pages |

**Using the API to create the Data Source**

To make the API call that creates the Data Source, you will need to provide three things:
1. Your Auth Token that allows creating Data Sources.
2. A name for the Data Source.
3. The schema of the Data Source (its columns and types)

**Auth token**

The easiest way to get your authentication token to create a Data Source is to copy-paste it from the code snippets we show in our UI.

1. Sign in your Tinybird account.

2. Click on `Add new Data Source` (or press P)

    ![image](https://user-images.githubusercontent.com/1078228/138217402-0e2b1a37-87ff-4c72-addf-021eec6d75d0.png)

3. Copy-paste your token from the code snippet at the bottom

    ![token](https://user-images.githubusercontent.com/1078228/138218035-bc5ca151-e99d-432b-b719-79207ca1cda2.png)

**⚠️Warning!** The token shown in the snippets, the one you copied following this guide, is you admin token. Don't share it or publish it in your application. We'll later create a secure token exclusively for adding data to a Data Source. You can manage your tokens via API or using the Auth Tokens section in the UI. More detailed info at [Auth Tokens management](https://docs.tinybird.co/api-reference/token-api.html)

**Data Source schema**

The schema is the set of columns, their types and their jsonpaths, that you want to store in a Data Source. In this case, the schema will contain the set of default properties plus the extra data you want to send with every event.

For instance, let's say you want to send an `id` of the element that triggered the event, the user email and the section of your application where the event happened.

```
tinybird('click', {
  id: 'buy-button',
  userEmail: 'johndoe@doe.com',
  section: 'shopping cart'
})
```

The schema needed for the default properties plus that info is
```
schema:event String `json:$.event`, timestamp DateTime `json:$.timestamp`, session_start String `json:$.session_start`, uuid String `json:$.uuid`, id String `json:$.id`, userEmail String `json:$.userEmail`, section String `json:$.section`
``` 

As you can see, the template for every column is `{name of column} {type} {jsonpath}`

We encourage you to send a homogeneus object each time. That is, the same properties per event. If that's not possible, we advise you to mark the properties that are sent only sometimes as `Nullable`.

In our example, imagine that `section` is a value that you don't send every time. In that case, its schema would be
```
section Nullable(String) `json:$.section`
```

In any case, the fewer nullable columns you have, the better your queries performance will be.

**Calling the API**

Putting it all together! You'll have to call the API like this, using your token, your desired Data Source name and your schema.

```
curl \
  -H 'Authorization: Bearer {YOUR_TOKEN}' \
  -X POST \
  -G \
  -d 'mode=create' \
  -d 'format=ndjson' \
  -d 'name={YOUR_DATASOURCE_NAME}' \
  --data-urlencode 'schema=event String `json:$.event`, timestamp DateTime `json:$.timestamp`, session_start String `json:$.session_start`, uuid String `json:$.uuid`, id String `json:$.id`, userEmail String `json:$.userEmail`, section Nullable(String) `json:$.section`' \
  https://api.tinybird.co/v0/datasources
```

There you go! Now you have a Data Source where Tinybird-tracker can start sending data.

![datasource](https://user-images.githubusercontent.com/1078228/138261590-25479310-b259-439c-bf42-2c3ebe33fc05.png)

**Getting an access token to append data**

In order to make calls to append data to a Data Source, you will need a token. The one we used before is not elligible since it's your admin one and you don't want it to be public in the call you make from your application.

Let's create one, only for appending to your recently created Data Source.

1. Go to `Manage Auth Tokens` in the sidebar

    ![auth tokens sidebar](https://user-images.githubusercontent.com/1078228/138264926-4611add5-1d5c-4ea9-95be-32b13446938b.png)

2. Click on `Create New`

3. Click on `Add Data Source scope`

4. Select the Data Source you created previously.

5. Select only the `Append` scope and click on `Add`

6. Give a descriptive name of the token, like `Events token`. You can do it modifying the generated name in the top of the form, that'll be something like `New Token {random number}`.

7. Save changes

Now you have everything you need to start sending events: a Data Source and a secure append token.

### Instantiating the script

Place this code snippet in your HTML file, adding the secure append token you've just created and the Data Source name.

```html
<script data-token="YOUR_TOKEN" data-source="YOUR_DATASOURCE_NAME" src="https://cdn.tinybird.co/static/js/t.js"></script>
```

Here it is the list of available options for the script:

| Name  | Default value | Description | Required |
| - | - | - | - |
| token  |  | Access token to append data to the Data Source | yes |
| source  |  | Name of the Data Source to send the events to | yes |
| api | https://api.tinybird.co | API URL origin | no |

In order to set their values, add them as data attributes (`data-xxxx`) in the script instantation.

The `api` option selects the API server to call to. It's needed if you are in a different cluster from the default EU one.

### Issuing events

Once the script is loaded in the DOM, you can start sending events with the `tinybird` object.
It accepts two parameters, the first one is the event name, and the second one, the rest of the attributes you want to store.

This is an example of storing a `pageload` event which will be triggered once the script is loaded:

```html
<script>
  tinybird('pageload', { referrer: document.referrer, page: 'landing_page_1' })
</script>
```

The following would be an example to trigger "onclick":

```javascript
tinybird('click', { 
  referrer: document.referrer,
  page: 'landing_page_1',
  place: 'sign-up button'
})
```

If you want to initialize the `tinybird` object with events before the script is loaded and ready, you can add as many tuple events as in an Array:

```html
<script>
  window.tinybird = [
    ['event_name', { hey: 'hello' }],
    ['click', { place: 'image' }]
  ]
</script>
```

### Checking that everything works

If you go to the Tinybird UI you will see the events in the Data Source modal.

![populated datasource](https://user-images.githubusercontent.com/1078228/138273316-9dd46c52-9beb-4e37-84b8-82f9ab219f3d.png)

Now, your imagination is the limit! Read [our guides to know how to consume this data creating endpoints](https://docs.tinybird.co/api-reference/query-api.html) and integrating them in your apps, dashboards, you name it!
