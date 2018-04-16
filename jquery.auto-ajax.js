/**
 * Auto Ajax
 *
 * @author Hampus Nordin <nordin.hampus@gmail.com>
 */
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

  var pluginName = 'autoAjax';
  var attrName = 'data-auto-ajax';
  var eventKey = 'auto-ajax';
  var events = {
    "BEFORE": "before." + eventKey,
    "DONE":   "done." + eventKey,
    "FAIL":   "fail." + eventKey,
    "ALWAYS": "always." + eventKey,
    "CLICK":  "click." + eventKey,
    "SUBMIT": "submit." + eventKey
  };

  function getNodeIdFromElementId (elementId) {
    return elementId.replace('svid', '').replace('_', '.');
  }

  function elementIdIsNodeId (elementId) {
    return elementId.indexOf('svid') === 0;
  }

  function elementHasCommentChild (element) {
    var firstChild = element.children[0];
    if (firstChild && firstChild.firstChild && firstChild.firstChild.nodeType === Node.COMMENT_NODE) {
      return true;
    }
    return false;
  }

  function getPortletUrl (pageId, nodeId) {
    if (pageId && nodeId) {
      return '/' + pageId + '/' + nodeId + '.portlet';
    }
    return false;
  }

  function onClickCallback (event) {
    var link = event.target;
    var instance = this;
    var $element = $(instance.element);

    // Halt execution if something seems to be wrong with element
    // or if it's been removed from the document body.
    if (!instance.element || !document.body.contains(instance.element)) {
      return;
    }

    $element.addClass(instance.options.loadingClass);
    $element.trigger(events.BEFORE, [instance]);

    $.ajax(link.href)
      .always(function () {
        $.ajax(instance.portletUrl)
          .done(function (data, textStatus, jqXHR) {
            // Build new content.
            var $newContent = $();
            if (elementHasCommentChild(instance.element)) {
              $newContent = $newContent.add($(instance.element.children[0]));
            }
            $newContent = $newContent.add($(data));
            $(instance.element).html($newContent);
            
            $element.trigger(events.DONE, [instance, event, data, textStatus, jqXHR]);
          })
          .fail(function (jqXHR, textStatus, errorThrown) {
            $element.trigger(events.FAIL, [instance, event, jqXHR, textStatus, errorThrown]);
          })
          .always(function (dataOrJqXHR, textStatus, jqXHROrErrorThrown) {
            $element.removeClass(instance.options.loadingClass);
            $element.trigger(events.ALWAYS, [instance, event, dataOrJqXHR, textStatus, jqXHROrErrorThrown]);
          });
      });

    event.preventDefault();
  }

  function onSubmitCallback (event) {
    var instance = this;
    var $element = $(instance.element);
    var form = event.target;
    var $form = $(form);
    var formData = $form.serialize();
    
    // Halt execution if something seems to be wrong with element
    // or if it's been removed from the document body.
    if (!this.element || !document.body.contains(this.element)) {
      return;
    }

    $element.addClass(instance.options.loadingClass);
    $element.trigger(events.BEFORE, [instance]);

    $.ajax(form.action, {
      data: formData,
      method: form.method
    }).always(function () {
      $.ajax(instance.portletUrl + '?' + formData)
        .done(function (data, textStatus, jqXHR) {
          // Build new content.
          var $newContent = $();
          if (elementHasCommentChild(instance.element)) {
            $newContent = $newContent.add($(instance.element.children[0]));
          }
          $newContent = $newContent.add($(data));
          $element.html($newContent);

          $element.trigger(events.DONE, [instance, event, data, textStatus, jqXHR]);
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
          $element.trigger(events.FAIL, [instance, event, jqXHR, textStatus, errorThrown]);
        })
        .always(function (dataOrJqXHR, textStatus, jqXHROrErrorThrown) {
          $element.removeClass(instance.options.loadingClass);
          $element.trigger(events.ALWAYS, [instance, event, dataOrJqXHR, textStatus, jqXHROrErrorThrown]);
        });
    });

    event.preventDefault();
  }

  // The actual plugin constructor
  function Plugin (element, options) {
    this.element    = element;
    this.options    = $.extend(true, {}, $.fn[pluginName].defaults, options);
    this._name      = pluginName;

    this.elementId  = this.element.id;
    this.portletId  = getNodeIdFromElementId(this.elementId);
    this.portletUrl = getPortletUrl(this.options.pageId, this.portletId);

    this.init();
  }

  $.extend(Plugin.prototype, {
    init: function () {
      $(this.element)
        .attr(attrName, '')
        .on(events.CLICK + '.' + this.elementId, 'a', $.proxy(onClickCallback, this))
        .on(events.SUBMIT + '.' + this.elementId, 'form', $.proxy(onSubmitCallback, this));
    },
    destroy: function () {
      $(this.element)
        .removeAttr(attrName)
        .off(events.CLICK + '.' + this.elementId)
        .off(events.SUBMIT + '.' + this.elementId);
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
      }
    });
  };

  $.fn[pluginName].defaults = {
    "loadingClass": "auto-ajax--loading",
    "pageId":       sv.PageContext.pageId
  };

}));
