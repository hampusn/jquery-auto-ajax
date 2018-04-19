Auto Ajax
=========

Tries to automatically do ajax requests for links (`click`) and forms (`submit`) in a SiteVision module.
Target can be anything with a valid `svid` as html ID.

```js
$('.sv-random-portlet').autoAjax({
  "loadingClass": "auto-ajax--loading", // Style class added to the element before the ajax call is fired and removed afterwards.
  "pageId":       sv.PageContext.pageId, // The current page's identifier.
  "exclude":      "" // Selector which the element will be matched against. If a match occur, no ajax request will be made.
});

```

## Events

The `before` event is fired just before the ajax call. `done`, `fail` and `always` are the usual jqXHR callbacks for the ajax call.

`instance` is the plugin object and `originalEvent` is the event for the link click or form submit.


```js
$('.sv-random-portlet').on('before.auto-ajax', function (event, instance, originalEvent) {});
$('.sv-random-portlet').on('done.auto-ajax', function (event, instance, originalEvent, data, textStatus, jqXHR) {});
$('.sv-random-portlet').on('fail.auto-ajax', function (event, instance, originalEvent, jqXHR, textStatus, errorThrown) {});
$('.sv-random-portlet').on('always.auto-ajax', function (event, instance, originalEvent, dataOrJqXHR, textStatus, jqXHROrErrorThrown) {});

```