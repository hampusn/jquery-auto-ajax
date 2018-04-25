Auto Ajax
=========

Tries to automatically do ajax requests for links (`click`) and forms (`submit`) in a SiteVision module.

## Basic usage

Target can be anything with a valid `svid` as html ID.

### Options

```js
$('.sv-random-portlet').autoAjax({
  "loadingClass": "auto-ajax--loading", // Style class added to the element before the ajax call is fired and removed afterwards.
  "pageId":       sv.PageContext.pageId, // The current page's identifier.
  "exclude":      "" // Selector which the element will be matched against. If a match occur, no ajax request will be made.
});
```

### Manually refreshing element

Manual refresh of portlet is possible through the `refresh` command. This might be useful if one would want to refresh related portlets when the main portlet is updated. For instance, you could refresh all `sv-listbookmark2-portlet` when the `sv-crdbookmark2-portlet` is used so the bookmark list portlets are up to date.

```js
// EXAMPLE 1: Update/refresh a random SiteVision portlet.
$('.sv-random-portlet').autoAjax('refresh');


// EXAMPLE 2: Update portlet when another portlet's autoAjax is used
//
// Add auto ajax to bookmark portlet and make sure all bookmark lists
// are updated whenever the bookmark portlet is being used.
$('.sv-crdbookmark2-portlet')
  .autoAjax()
  .on('done.auto-ajax', function () {
    $('.sv-listbookmark2-portlet').autoAjax('refresh');
  });


// EXAMPLE 3: Bidirectional sync
//
// One might even want to let both portlets refresh each other.
// If that's the case, you should make sure that you never refresh the other portlet
// if the current portlet was being manually refreshed to begin with.
// That could create an infinite loop which is usually bad.
// This could be achieved by checked the `type` property of the `originalEvent`.
// When using the manual refresh, a dummy event named "refresh" is created
// since no original event existed in the first place.
$('.sv-listbookmark2-portlet')
  .autoAjax({"exclude": ":not([href*='removeBookmark'])"})
  .on('done.auto-ajax', function (event, instance, originalEvent) {
    if (originalEvent.type !== "refresh") {
      $('.sv-crdbookmark2-portlet').autoAjax('refresh');
    }
  });
$('.sv-crdbookmark2-portlet')
  .autoAjax()
  .on('done.auto-ajax', function (event, instance, originalEvent) {
    if (originalEvent.type !== "refresh") {
      $('.sv-listbookmark2-portlet').autoAjax('refresh');
    }
  });

```

> **Warning!** Refreshing the instance inside a callback attached to the same instance will result in an infinite loop of ajax requests.

### Remove plugin from element

Removal of plugin is done through the `destroy` command. This will remove attributes, events and custom data attached by this plugin. If you handle events or data that needs to be cleaned, do so before using this command.

```js
$('.sv-random-portlet').autoAjax('destroy');
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
