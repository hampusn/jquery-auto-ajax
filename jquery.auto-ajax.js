/**
 * @file jQuery plugin for "ajaxifying" functions in SiteVision.
 * @author Hampus Nordin <nordin.hampus@gmail.com>
 * @copyright Hampus Nordin 2018
 * @license MIT
 * /
/* global sv, define, module, jQuery, require */
(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['jquery'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node/CommonJS
    module.exports = function( root, jQuery ) {
      if ( jQuery === undefined ) {
        // require('jQuery') returns a factory that requires window to
        // build a jQuery instance, we normalize how we use modules
        // that require this pattern but the window provided is a noop
        // if it's defined (how jquery works)
        if ( typeof window !== 'undefined' ) {
          jQuery = require('jquery');
        }
        else {
          jQuery = require('jquery')(root);
        }
      }
      factory(jQuery);
      return jQuery;
    };
  } else {
    // Browser globals
    factory(jQuery);
  }
}(function ($) {
  // Actual library code

  var pluginName = 'autoAjax';
  var attrName = 'data-auto-ajax';
  var eventKey = 'auto-ajax';
  var events = {
    "BEFORE": "before." + eventKey,
    "INIT":   "init." + eventKey,
    "DONE":   "done." + eventKey,
    "FAIL":   "fail." + eventKey,
    "ALWAYS": "always." + eventKey,
    "CLICK":  "click." + eventKey,
    "SUBMIT": "submit." + eventKey
  };

  /**
   * Get an options object for an element.
   * 
   * @param  {Object}      options The passed/incoming options.
   * @param  {HTMLElement} element The html element.
   * @return {Object}
   */
  function getInstanceOptions (options, element) {
    var opts = $.extend(true, {}, $.fn[pluginName].defaults, options);

    if (!opts.pageId && sv && sv.PageContext && sv.PageContext.pageId) {
      opts.pageId = sv.PageContext.pageId;
    }

    return opts;
  }

  /**
   * Convert a html id into a SiteVision node identifier.
   *
   * @param  {String} elementId The html id.
   * @return {String}
   */
  function getNodeIdFromElementId (elementId) {
    return elementId.replace('svid', '').replace('_', '.');
  }

  /**
   * Returns true if html id seems to be a SiteVision node identifier.
   *
   * @param  {String} elementId The html id.
   * @return {Boolean}
   */
  function elementIdIsNodeId (elementId) {
    return elementId.indexOf('svid') === 0;
  }

  /**
   * Checks if the html element's first child is your typical
   * SiteVision portlet's div with name of portlet as comment.
   *
   * For example:
   *
   * <div class="sv-form-portlet">
   *   <div id="Epostformular"><!-- E-postformulär --></div>
   *   ...
   * </div>
   *
   * @param  {HTMLElement} element The html element to check.
   * @return {Boolean}
   */
  function elementHasCommentChild (element) {
    var firstChild = element.children[0];
    if (firstChild && firstChild.firstChild && firstChild.firstChild.nodeType === Node.COMMENT_NODE) {
      return true;
    }
    return false;
  }

  /**
   * Builds a portlet url which can be used to only get
   * the portlet's markup/html.
   *
   * @param  {String} pageId The page's node identifier.
   * @param  {String} nodeId The portlet's node identifier.
   * @return {String}
   */
  function getPortletUrl (pageId, nodeId) {
    if (pageId && nodeId) {
      return '/' + pageId + '/' + nodeId + '.portlet';
    }
    return '';
  }

  /**
   * Done callback for ajax request.
   * Handles the replacement of content.
   *
   * @param  {String} data       The new html of the portlet.
   * @param  {String} textStatus
   * @param  {Object} jqXHR
   * @return {Void}
   */
  function doneCallback (data, textStatus, jqXHR) {
    var instance = this.instance;
    var $element = $(instance.element);
    // Build new content.
    var $newContent = $();
    if (elementHasCommentChild(instance.element)) {
      $newContent = $newContent.add($(instance.element.children[0]));
    }
    $newContent = $newContent.add($(data));
    $element.html($newContent);

    $element.trigger(events.DONE, [instance, this.event, data, textStatus, jqXHR]);
  }

  /**
   * Fail callback for the ajax request.
   *
   * @param  {Object} jqXHR
   * @param  {String} textStatus
   * @param  {String} errorThrown The error message.
   * @return {Void}
   */
  function failCallback (jqXHR, textStatus, errorThrown) {
    var instance = this.instance;
    $(instance.element).trigger(events.FAIL, [instance, this.event, jqXHR, textStatus, errorThrown]);
  }

  /**
   * Always callback for the ajax request.
   *
   * @param  {String|Object} dataOrJqXHR
   * @param  {String}        textStatus
   * @param  {Object|String} jqXHROrErrorThrown
   * @return {Void}
   */
  function alwaysCallback (dataOrJqXHR, textStatus, jqXHROrErrorThrown) {
    var instance = this.instance;
    var $element = $(instance.element);
    $element.removeClass(instance.options.loadingClass);
    $element.trigger(events.ALWAYS, [instance, this.event, dataOrJqXHR, textStatus, jqXHROrErrorThrown]);
  }

  /**
   * Click callback.
   *
   * @param  {Object} event
   * @return {Boolean|Void}
   */
  function onClickCallback (event) {
    var link     = event.currentTarget;
    var instance = this;

    // Halt execution if something seems to be wrong with element
    // or if it's been removed from the document body.
    if (!instance.element || !document.body.contains(instance.element)) {
      return;
    }
    // Ignore callback when matching exclude selector.
    if (this.options.exclude && $(link).is(this.options.exclude)) {
      return true;
    }

    if (this.options.actionLinks) {
      $.ajax(link.href)
        .always(function () {
          instance.refresh(event);
        });
    } else {
      $(instance.element)
        .addClass(instance.options.loadingClass)
        .trigger(events.BEFORE, [instance, event]);

      $.ajax(link.href, {
        "context": {
          "instance": instance,
          "event":    event
        },
        dataFilter: function (data) {
          return $(data).find('#' + instance.elementId).get(0).innerHTML;
        }
      })
        .done(doneCallback)
        .fail(failCallback)
        .always(alwaysCallback);
    }

    event.preventDefault();
  }

  /**
   * Submit callback.
   *
   * @param  {Object} event
   * @return {Boolean|Void}
   */
  function onSubmitCallback (event) {
    var instance = this;
    var $element = $(instance.element);
    var form     = event.target;
    var $form    = $(form);

    // Halt execution if something seems to be wrong with element
    // or if it's been removed from the document body.
    if (!this.element || !document.body.contains(this.element)) {
      return;
    }
    // Ignore callback when matching exclude selector.
    if (this.options.exclude && $form.is(this.options.exclude)) {
      return true;
    }

    $element.addClass(instance.options.loadingClass);
    $element.trigger(events.BEFORE, [instance, event]);

    $.ajax(form.action, {
      "data":        form.method === 'post' ? new FormData(form) : $form.serialize(),
      "method":      form.method,
      "contentType": form.enctype,
      "processData": form.method === 'post' ? false : true,
      "context": {
        "instance": instance,
        "event":    event
      },
      dataFilter: function (data) {
        return $(data).find('#' + instance.elementId).get(0).outerHTML;
      }
    })
      .done(doneCallback)
      .fail(failCallback)
      .always(alwaysCallback);

    event.preventDefault();
  }

  /**
   * Plugin constructor
   *
   * @param {HTMLElement} element
   * @param {Object}      options
   */
  function Plugin (element, options) {
    this.element    = element;
    this.options    = getInstanceOptions(element, options);
    this._name      = pluginName;

    this.elementId  = this.element.id;
    this.portletId  = getNodeIdFromElementId(this.elementId);
    this.portletUrl = getPortletUrl(this.options.pageId, this.portletId);

    // Portlet URL is required for this plugin to work.
    if (this.portletUrl) {
      this.init();
    }
  }

  $.extend(Plugin.prototype, {
    init: function () {
      $(this.element)
        .attr(attrName, '')
        .on(events.CLICK + '.' + this.elementId, 'a', $.proxy(onClickCallback, this))
        .on(events.SUBMIT + '.' + this.elementId, 'form', $.proxy(onSubmitCallback, this))
        .trigger(events.INIT, [this]);
    },
    destroy: function () {
      $(this.element)
        .removeAttr(attrName)
        .off(events.CLICK + '.' + this.elementId)
        .off(events.SUBMIT + '.' + this.elementId);
    },
    refresh: function (event) {
      event = event || $svjq.Event('refresh');

      $(this.element)
        .addClass(this.options.loadingClass)
        .trigger(events.BEFORE, [this, event]);

      $.ajax(this.portletUrl, {
        "context": {
          "instance": this,
          "event":    event
        }
      })
        .done(doneCallback)
        .fail(failCallback)
        .always(alwaysCallback);
    }
  });

  // A really lightweight plugin wrapper around the constructor,
  // preventing against multiple instantiations
  $.fn[pluginName] = function (options) {
    var key = "plugin_" + pluginName;

    return this.each(function () {
      var plugin = $.data(this, key);

      if (!plugin) {
        if (elementIdIsNodeId(this.id)) {
          $(this).find('[' + attrName + ']')[pluginName]('destroy');
          plugin = new Plugin(this, options);
          $.data(this, key, plugin);
        }
      } else if (options === 'destroy') {
        plugin.destroy();
        $.removeData(this, key);
      } else if (options === 'refresh') {
        plugin.refresh();
      }
    });
  };

  /**
   * Plugin defaults
   *
   * @type {Object}
   */
  $.fn[pluginName].defaults = {
    "loadingClass": "auto-ajax--loading",
    "pageId":       (sv && sv.PageContext) ? sv.PageContext.pageId : "",
    "exclude":      "",
    "actionLinks":  true
  };

}));
