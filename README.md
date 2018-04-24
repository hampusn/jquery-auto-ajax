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

Manual refresh of portlet is possible through the `refresh` command. This might be useful if one would want to refresh related portlets when the main portlet is updated. For instance, you could refresh all `sv-listbookmark2-portlet` when the `sv-crdbookmark2-portlet` is used so the bookmark list portlets are up to date.

```js
// Update/refresh a random SiteVision portlet.
$('.sv-random-portlet').autoAjax('refresh');

// Add auto ajax to bookmark portlet and make sure all bookmark lists are updated whenever the bookmark portlet is being used.
$svjq('.sv-crdbookmark2-portlet')
  .autoAjax()
  .on('done.auto-ajax', function () {
    $svjq('.sv-listbookmark2-portlet').autoAjax('refresh');
  });
```

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
