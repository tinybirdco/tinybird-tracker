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
(function(t,i0,n,y,b,i1,r,d){t[y]=t[y]||[];var z=i0.getElementsByTagName(n)[0],w=i0.createElement(n),fn=y!='tbt'?'&f='+y:'',a=!!i1?'&a='+i1:'',da=!!r?'&d='+r:'',h=!!d?'&h='+d:'';
w.async=true;w.src='https://cdn.tinybird.co/static/js/t.js?c=whatever&t='+b+fn+a+da+h;z.parentNode.insertBefore(w,z);
})(window, document, 'script', 'tbt', '{{tracker_append_token}}')
</script>
```

## Issuing events

If the `tbt` code is called after the container snippet, any variables declared within will not be available for the tracker to selectively fire events on page load. This is an example of storing an event of `pageload` which will be triggered once the script is loaded:

```html
<script>
  window.tbt = window.tbt || []
  tbt.push(['pageload', document.referrer, 'landing_page_1' ])
</script>
<!-- Tinybird Tracker -->
...
<!-- End Tinybird Tracker -->
```

The following would be an example to trigger "onclick":

```javascript
tbt.push(['click', document.referrer, 'landing_page_1', 'sign-up button'])
```


