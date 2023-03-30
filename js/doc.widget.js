(function($, global) {

  $(document).ready( function() {
    documentation.init();
  });

  var documentation = {

    init: function() {

      this.sectionAjax = document.querySelector('[data-ajax]');
      this.headerHeading = document.querySelector('.js-heading');
      this.contentCounter = document.querySelector('.content-counter');
      this.scrollWrapper = document.querySelector('.scroll-wrapper');
      this.LongLoadOverlay = document.querySelector('.long-loading');
      this.nextBtnPaginationMain = document.querySelector('.pagination__item--next');
      this.prevBtnPaginationMain = document.querySelector('.pagination__item--prev');
      this.menuScroll;

      this.startClick('.intro');
      this.initNavigation();
      this.startAnimation($('.main-nav > .main-nav__item'));
      this.firstScreen = true;
      this.firstSearch = true
    },

    startClick: function (introContainer) {
      var $introContainer = $(introContainer);

      if ( $introContainer.length === 0 ) {
        return 0;
      }

      var $buttonStart = $introContainer.find('.js-start');
      
      $buttonStart.click(function(e) {
        e.preventDefault();

        var windowHeight = $(window).outerHeight();
        var introContainerOffsetBottom = $introContainer.offset().top + $introContainer.outerHeight();
        var posY = e.clientY;

        $('html, body').animate({
            scrollTop: introContainerOffsetBottom
        }, posY/windowHeight*1100);
      });
    },

    initNavigation: function() {
      var ajaxLinks = $('[data-link]');
      this.mainNavigation(ajaxLinks);
      
      var $navContainer = $('.navigation-wrapper');

      if ( $navContainer.length > 0 ) {
        var $toggleBtn = $navContainer.find('.js-open-btn');
        var _this = this;

        $toggleBtn.click(function() {
          _this.toggleNavigation($navContainer);
        });
      }
    },

    mainNavigation: function($navLinks) {
      if ( $navLinks.length === 0 ) {
        return null;
      }
    
      var _this = this;

      $navLinks.click(function(e) {

        if ( $(e.currentTarget).attr('data-link') === 'index.html') {
          return 0;
        }

        e.preventDefault();
        _this.navLinkEvent(e);
      });
    },

    navLinkEvent: function(e){
      var $targetLink = $(e.currentTarget);
      
      var $dropdownContainer = $targetLink.closest('.main-nav__item');

      if ( $('body').hasClass('initial-page') ) {
        var $navContainer = $('.navigation-wrapper');
      } else {
        var $navContainer = $targetLink.closest('.navigation-wrapper');
      }

      var openedDropdown = $navContainer.find('.has-dropdown.show');


      if ( $targetLink.length > 0 ) {
        if ( $targetLink.attr('data-link')) {
          this.loadPage($targetLink.attr('data-link'), $targetLink[0]);
          this.toggleNavigation($navContainer);
        } else if ( $dropdownContainer.hasClass('show') ){
          this.showHideDropdown($targetLink.parent('.show'));
        } else if (openedDropdown.length > 0 ) {
          this.showHideDropdown(openedDropdown);
          this.showHideDropdown($targetLink.parent());
        } else {
          this.showHideDropdown($dropdownContainer);
        }
      }
    },

    toggleNavigation: function($navContainer) {
      if ( $navContainer.length === 0 ) {
        return 0;
      }

      if ( $navContainer.hasClass('open') ) {
        $navContainer.removeClass('open').addClass('close');
        this.enableScroll();
        this.addClassAfterAnimation($('.js-heading'), 'display-none');
      } else {
        $navContainer.removeClass('close').addClass('open');
        this.disableScroll();
        this.removeClassAfterAnimation($('.js-heading'), 'display-none');
        if (this.menuScroll) {
          this.menuScroll.resize();
        }
      }
    },

    showHideDropdown: function($dropdownContainer) {
      if ( $dropdownContainer.length === 0 ) {
        return 0;
      }

      var $dropdown = $dropdownContainer.find('.main-nav__secondary');
      var _this = this;

      if ( $dropdownContainer.hasClass('show') ) {
        $dropdownContainer.removeClass('show');
        $dropdown.slideUp(300, function() {
          if (_this.menuScroll) {
            _this.menuScroll.resize();
          }
        });
      } else {
        $dropdownContainer.addClass('show');
        $dropdown.slideDown(300, function() {
          if (_this.menuScroll) {
            _this.menuScroll.resize();
          }
        });
      }

    },

    loadPage: function(newPage, targetAnchor) {
      if ( newPage === 'index.html' ) {
        return 0;
      }

      var counter = newPage.slice(0, 2);;

      if ( this.firstScreen ) {

        this.firstScreen = false;
        counter = newPage.slice(6, 8);
      } else if ( targetAnchor.classList.contains('main-nav__link') ||  targetAnchor.classList.contains('pagination__item') ||  targetAnchor.classList.contains('result-link')) {

        newPage = newPage.slice(6);
        console.log(newPage);
        counter = newPage.slice(0, 2);
      }


      var request = new XMLHttpRequest();
      request.open('GET', newPage, true);
   

      var _this = this;
      var preloaderBtnBack = this.LongLoadOverlay.querySelector('.js-back');
      var preloaderBtnDirect = this.LongLoadOverlay.querySelector('.js-direct');

      // Timer to show buttons if loading takes more than 3 seconds
      var timerForBtns = setTimeout(function() {
          _this.LongLoadOverlay.classList.remove('elem-hide');
          preloaderBtnBack.addEventListener('click', back);
          preloaderBtnDirect.addEventListener('click', direct);
      }, 7000);

      var back = function() {
          request.removeEventListener('load', addLoadedPage);
          _this.LongLoadOverlay.classList.add('elem-hide');

      };

      var direct = function() {
          request.removeEventListener('load', addLoadedPage);
          _this.LongLoadOverlay.classList.remove('elem-hide');
          _this.LongLoadOverlay.classList.add('elem-hide');
          window.location.href = targetAnchor.href;
      };

      var addLoadedPage = function() {
          if (request.status >= 200 && request.status < 400) {
              // Success!
              var resp = request.responseText;


              clearTimeout(timerForBtns);
              preloaderBtnBack.removeEventListener('click', back);
              preloaderBtnDirect.removeEventListener('click', direct);
              _this.sectionAjax.classList.add('fadeInStart');
              _this.headerHeading.classList.add('fadeInStart');
            

              var bodyBegin = resp.indexOf('<body>');
              var bodyEnd = resp.indexOf('</body>');

              if (bodyBegin != -1 && bodyEnd != -1) {
                  resp = resp.slice(bodyBegin + 6, bodyEnd);
              }

              var fragment = document.createElement('div');
              fragment.innerHTML = resp;

              var prevBtnPagination = fragment.querySelector('.pagination__item--prev');
              var nextBtnPagination = fragment.querySelector('.pagination__item--next');

              if ( prevBtnPagination.getAttribute('href') === "" ) {
                _this.prevBtnPaginationMain.style.display = 'none';
              } else {
                _this.prevBtnPaginationMain.style.display = '';
                var prevBtnPaginationText = prevBtnPagination.querySelector('.pagination__item-page');
                var prevBtnPaginationTextMain = _this.prevBtnPaginationMain.querySelector('.pagination__item-page');
                _this.prevBtnPaginationMain.setAttribute('data-link', prevBtnPagination.getAttribute('data-link'));
                _this.prevBtnPaginationMain.setAttribute('href', prevBtnPagination.getAttribute('href'));
                prevBtnPaginationTextMain.textContent = prevBtnPaginationText.textContent;
              }

              if ( nextBtnPagination.getAttribute('href') === "" ) {
                _this.nextBtnPaginationMain.style.display = 'none';
              } else {
                _this.nextBtnPaginationMain.style.display = '';
                var nextBtnPaginationText = nextBtnPagination.querySelector('.pagination__item-page');
                var nextBtnPaginationTextMain = _this.nextBtnPaginationMain.querySelector('.pagination__item-page');
                _this.nextBtnPaginationMain.setAttribute('data-link', nextBtnPagination.getAttribute('data-link'));
                _this.nextBtnPaginationMain.setAttribute('href', nextBtnPagination.getAttribute('href'));
                nextBtnPaginationTextMain.textContent = nextBtnPaginationText.textContent;
              }
              
              // Check if received fragment has element with 'data-load' attribute
              var dataLoad = fragment.querySelector('[data-load]');

              if (dataLoad) {
                  fragment = dataLoad;
                  var heading = fragment.getElementsByTagName('h2');
                  var textHeading = heading[0].textContent;
                  heading[0].style.display = 'none';
              }

              // Replace img source
              var lightboxLink = fragment.querySelectorAll('[data-lightbox]');
              if ( lightboxLink.length > 0 ) {
                var newSourse;
                for (var i = 0, max = lightboxLink.length; i < max; i++) {
                  if ( (document.body.classList.contains('initial-page') && targetAnchor.classList.contains('result-link')) || (document.body.classList.contains('initial-page') && targetAnchor.classList.contains('main-nav__link')) ) {
                    newSourse = lightboxLink[i].href.slice(0, lightboxLink[i].href.indexOf('/img'))+ '/pages' + lightboxLink[i].href.slice(lightboxLink[i].href.indexOf('/img'));
                  } else if ( targetAnchor.classList.contains('result-link') ) {
                    newSourse = lightboxLink[i].href;
                  } else {
                    newSourse = lightboxLink[i].href.slice(0, lightboxLink[i].href.indexOf('/img')) + lightboxLink[i].href.slice(lightboxLink[i].href.indexOf('/img'));
                  }
                  lightboxLink[i].href = newSourse;
                  lightboxLink[i].firstElementChild.src = newSourse;
                }
                _this.firstSearch = false;
              }
              
              document.body.classList.remove('initial-page');
              document.body.classList.add('secondary-page');

              _this.sectionAjax.innerHTML = fragment.innerHTML;
              _this.headerHeading.textContent = textHeading;
              _this.contentCounter.textContent = counter;

              $('html, body').animate({
                scrollTop: 0
              }, 350, function(){
                _this.sectionAjax.classList.add('fadeIn');
                _this.headerHeading.classList.add('fadeIn');
              });

              _this.removeClassAfterAnimation(_this.sectionAjax, 'fadeIn fadeInStart');
              _this.removeClassAfterAnimation(_this.headerHeading, 'fadeIn fadeInStart');

              var newDataLinks = _this.sectionAjax.querySelectorAll('[data-link]');
              _this.ajaxLoadForNewPage(newDataLinks);

              if ( !_this.menuScroll ) {
                _this.menuScroll = global.createScrollbar(_this.scrollWrapper, {
                  touchScrollSpeed: 1,
                  preventDefaultScroll: true
                });
              }

              window.history.pushState(null, null, newPage);

          } else {
              // We reached our target server, but it returned an error
              window.location.href = targetAnchor.href;
          }
      }

      request.addEventListener('load', addLoadedPage);

      request.onerror = function() {
          // There was a connection error of some sort
          window.location.href = targetAnchor.href;
      };

      request.send();
    },

    ajaxLoadForNewPage: function(links) {

      if (!links) {
        return 0;
      }

      var _this = this;
      var hrefLink, currentLink; 

      for ( var i = 0, max = links.length; i < max; i++ ) {
        links[i].addEventListener('click', function (e) {
          e.preventDefault();
          currentLink = links[i];
          hrefLink = e.currentTarget.getAttribute('data-link');
          _this.loadPage(hrefLink, e.currentTarget);
        });
      }
    },

    startAnimation: function($animElem) {
      if ( $animElem.length === 0 ) {
        return 0;
      }

      var topPointFirstElement = $($animElem[0]).offset().top - $(window).outerHeight() + 150;

      if ( $(window).scrollTop() > topPointFirstElement ) {
        addAnimClass($animElem);
      }

      $(window).on('scroll', function animation(){
        y = $(window).scrollTop();

        if (y > topPointFirstElement) {
          $(window).off('scroll', animation);
          addAnimClass($animElem);
        }

      });

      function addAnimClass ($animElem) {
        var i = 0;
        var animInterval = setInterval(function(){
          $($animElem[i]).addClass('fadeUp');

          if ( i === ($animElem.length - 1) ) {
            clearInterval(animInterval);
          }

          i++
        }, 100);
      }
    },

    addClassAfterAnimation: function($elem, clases){
      if ( $elem.length === 0 ) {
        return 0;
      }

      if ( !($elem instanceof jQuery) ) {
        $elem = $($elem);
      }

      $elem.one('webkitAnimationEnd oanimationend msAnimationEnd animationend', function addClasses() {
        $elem.addClass(clases);
        $elem.off('webkitAnimationEnd oanimationend msAnimationEnd animationend', addClasses);
      });
    },

    removeClassAfterAnimation: function($elem, clases){
      if ( $elem.length === 0 ) {
        return 0;
      }

      if ( !($elem instanceof jQuery) ) {
        $elem = $($elem);
      }

      $elem.one('webkitAnimationEnd oanimationend msAnimationEnd animationend', function removeClasses() {
        $elem.removeClass(clases);
        $elem.off('webkitAnimationEnd oanimationend msAnimationEnd animationend', removeClasses);
      });
    },

    // http://stackoverflow.com/questions/4770025/how-to-disable-scrolling-temporarily
    disableScroll: function () {
      if (window.addEventListener) // older FF
          window.addEventListener('DOMMouseScroll', this.preventDefault, false);
      window.onwheel = this.preventDefault; // modern standard
      window.onmousewheel = document.onmousewheel = this.preventDefault; // older browsers, IE
      window.ontouchmove  = this.preventDefault; // mobile
    },

    enableScroll: function () {
        if (window.removeEventListener)
            window.removeEventListener('DOMMouseScroll', this.preventDefault, false);
        window.onmousewheel = document.onmousewheel = null; 
        window.onwheel = null; 
        window.ontouchmove = null;    
    },

    preventDefault: function (e) {
      e = e || window.event;
      if (e.preventDefault)
          e.preventDefault();
      e.returnValue = false;  
    }
  };

  global.documentation = documentation;

  return global;
})($, global || {});