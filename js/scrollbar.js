var global = (function(global) {

    //var frameRequested;
    var autoScrollFrame;
    //var newThumbPosition = 0, newOverviewPosition = 0;
    var scrollHideDelay = 500;
    //var thumbPosition = 0, overviewPosition = 0;
    var velocity, amplitude, frame = 0, timestamp, ticker, target;

    var Scrollbar = function (HTMLElement, options) {
        //thumb is handle of scrollbar, also known as scrollbox

        Object.defineProperties(this, {
            _element: {
                value: HTMLElement
            },
            _viewPort: {
                value: document.createElement('div')
            },
            _overview: {
                value: document.createElement('div')
            },
            _scrollbarTrack: {
                value: document.createElement('div')
            },
            _thumb: {
                value: document.createElement('div')
            },
            // multiplicator for touch movement (number)
            touchScrollSpeed: {
                value: options.touchScrollSpeed || 1
            },
            //multiplicator for mouse wheel movement (number)
            mouseWheelSpeed: {
                value: options.mouseWheelSpeed || 0.5,
                writable: true
            },
            // if customThumbHeight is defined, thumb height is fixed. If customThumbHeight is undefined, thumb height is calculated depending on other sizes (number)
            customThumbHeight: {
                value: options.customThumbHeight || undefined
            },
            // if true parent element cannot be scrolled while mouse/touch is on the 'scrollable' element (bool)
            preventDefaultScroll: {
                value: options.preventDefaultScroll ||  false
            },
            // if true sizes of scrollbar are recalculated when window is resized (bool)
            _updateOnWindowResize: {
                value: options.updateOnWindowResize || true
            },
            // _measurements will contain all necessary information about sizes and maximum positions
            _measurements: {
                value: {}
            },
            _enabled: {
                value: false,
                writable: true
            }
        });

        this.newThumbPosition = 0;
        this.newOverviewPosition = 0;
        this.thumbPosition = 0;
        this.overviewPosition = 0;
        this.frameRequested = false;

        //Classes are added for proper work of CSS styles
        this._element.classList.add('scrollable');
        this._viewPort.classList.add('viewport');
        this._overview.classList.add('overview');
        this._scrollbarTrack.classList.add('scrollbar-track');
        this._thumb.classList.add('thumb');

        var fragment = document.createDocumentFragment();
        fragment.appendChild(this._scrollbarTrack);
        this._scrollbarTrack.appendChild(this._thumb);
        fragment.appendChild(this._viewPort);
        this._viewPort.appendChild(this._overview);

        var children = this._element.children;
        while (children.length) {
            this._overview.appendChild(children[0]);
        }
        this._element.appendChild(fragment);

        this._checkOverflow();
        this._calculateHeights();
        if (!this._enabled) {
            this._scrollbarTrack.classList.add('display-none');
        }

        this._setScrollPosition();

        this._initScrollingByThumbMousemove();
        this._initMouseWheelScrolling();
        if ('ontouchstart' in window) {
            this._initTouchScrolling();
            this._initScrollingByThumbTouchmove();
        }
        if ('onpointerdown' in window) {
            this._initPointerScrolling();
        }

        if (this._updateOnWindowResize) {
            this._initWindowResize();
        }
    };

    Object.defineProperties(Scrollbar.prototype, {

        _setScrollPosition: {
            value: function() {                            
                if (transformProperty === "msTransform") {
                    this._thumb.style[transformProperty] = 'translateY(' + this.newThumbPosition + 'px)';
                    this._overview.style[transformProperty] = 'translateY(' + (-this.newOverviewPosition) + 'px)';
                } else {
                   this._thumb.style[transformProperty] = 'translateY(' + this.newThumbPosition + 'px) translateZ(0)';
                    this._overview.style[transformProperty] = 'translateY(' + (-this.newOverviewPosition) + 'px) translateZ(0)'; 
                }
                
                this.thumbPosition = parseInt(this._thumb.style[transformProperty].slice(11), 10); // translateY( - 11 characters
                
                this.overviewPosition = -parseInt(this._overview.style[transformProperty].slice(11));
                this.frameRequested = false;
            }
        },

        //calculates all sizes of scrollbar
        _calculateHeights: {
            value: function() {

                this._measurements.ratio = this._measurements.viewPortHeight / this._measurements.overviewHeight;
                this._measurements.thumbHeight = this._calculateThumbHeight();
                this._measurements.maxThumbPosition = this._calculateMaxThumbPosition();
                this._measurements.maxOverviewPosition = this._calculateMaxOverviewPosition();                
                this._thumb.style.height = this._measurements.thumbHeight + 'px';
                if (this._measurements.scrollPercent === undefined) {
                    this._measurements.scrollPercent = 0;
                }
            },
        },

        _checkOverflow: {
            value: function() {
                this._measurements.viewPortHeight = this._element.clientHeight - parseInt(getComputedStyle(this._element).paddingTop);
                this._measurements.overviewHeight = this._overview.scrollHeight;
                this._enabled = (this._measurements.overviewHeight > this._measurements.viewPortHeight);
            }
        },

        resize: {
            value: function () {
                cancelAnimationFrame(autoScrollFrame);                
                this._checkOverflow();
                if (this._enabled) {
                    this._calculateHeights();
                    this._scrollbarTrack.classList.remove('display-none');
                } else {                    
                    this._scrollbarTrack.classList.add('display-none');
                    this.scrollOverviewTo(0);
                }           
            },
            enumerable: true
        },

        _calculateThumbHeight: {
            value: function() {
                var height = this.customThumbHeight ? this.customThumbHeight : (this._measurements.ratio * this._measurements.viewPortHeight);
                return height;
            }
        },

        _calculateMaxThumbPosition: {
            value: function() {
                return Math.max(0, this._measurements.viewPortHeight - this._measurements.thumbHeight);
            }
        },

        _calculateMaxOverviewPosition: {
            value: function() {
                return Math.max(0, this._measurements.overviewHeight - this._measurements.viewPortHeight);
            }
        },

        _initScrollingByThumbMousemove: {
            value: function() {
                var _this = this;
                var isScrollingByThumbMousemove = false;
                var timer;
                var scrollByThumbMousemove = function(e) {
                    _this._scrollByThumbMousemove(e);
                };

                this._thumb.addEventListener('mousedown', function(e) {
                    if (_this._enabled) {
                        _this._startScrollingByThumbMousemove(e);
                        document.addEventListener('mousemove', scrollByThumbMousemove);
                        isScrollingByThumbMousemove = true;
                        _this._thumb.classList.add('scroll-active');
                        if (timer) {
                            clearTimeout(timer);
                        }
                    }
                });

                document.addEventListener('mouseup', function() {
                    if (isScrollingByThumbMousemove) {
                        isScrollingByThumbMousemove = false;
                        document.removeEventListener('mousemove', scrollByThumbMousemove);
                        timer = setTimeout(function() {
                            _this._thumb.classList.remove('scroll-active');
                        }, scrollHideDelay);
                        
                    }
                });

                this._thumb.addEventListener('click', function(e) {
                    e.stopPropagation();
                });
            }
        },

        _startScrollingByThumbMousemove: {
            value: function(e) {
                e.preventDefault(); // prevent selecting text
                this.lastY = e.pageY;
            }
        },

        _scrollByThumbMousemove: {
            value: function(e) {
                var delta = e.pageY - this.lastY;
                this._scrollTumbBy(delta);
                this.lastY = e.pageY;
            }
        },

        _initScrollingByThumbTouchmove: {
            value: function() {
                var _this = this;
                var isScrollingByThumbTouchmove = false;
                var timer;
                var scrollByThumbTouchmove = function(e) {
                    _this._scrollByThumbTouchmove(e);
                };

                this._thumb.addEventListener('touchstart', function(e) {
                    if (_this._enabled) {
                        _this._startScrollingByThumbTouchmove(e);
                        document.addEventListener('touchmove', scrollByThumbTouchmove);
                        isScrollingByThumbTouchmove = true;
                        _this._thumb.classList.add('scroll-active');
                        if (timer) {
                            clearTimeout(timer);
                        }
                    }
                });

                document.addEventListener('touchend', function() {
                    if (isScrollingByThumbTouchmove) {
                        isScrollingByThumbTouchmove = false;
                        document.removeEventListener('touchmove', scrollByThumbTouchmove);
                        timer = setTimeout(function() {
                            _this._thumb.classList.remove('scroll-active');
                        }, scrollHideDelay);
                    }
                });
            }
        },

        _startScrollingByThumbTouchmove: {
            value: function(e) {
                e.preventDefault(); // prevent selecting text
                this.lastY = e.changedTouches[0].pageY;
            }
        },

        _scrollByThumbTouchmove: {
            value: function(e) {
                var delta = e.changedTouches[0].pageY - this.lastY;
                this._scrollTumbBy(delta);
                this.lastY = e.changedTouches[0].pageY;
            }
        },

        _scrollTumbBy: {
            value: function(delta) {
                
                this.thumbPosition += delta;
                this.thumbPosition = positionOrMax(this.thumbPosition, this._measurements.maxThumbPosition);
                var oldScrollPercent = this._measurements.scrollPercent;
                this._measurements.scrollPercent = this.thumbPosition / this._measurements.maxThumbPosition;
                
                this.newThumbPosition = this.thumbPosition;
                this.newOverviewPosition = this._measurements.scrollPercent * this._measurements.maxOverviewPosition;
                if (!this.frameRequested) {
                    requestAnimationFrame(this._setScrollPosition.bind(this));
                    this.frameRequested = true;
                }
                return true;
            }
        },

        _initMouseWheelScrolling: {
            value: function() {
                var _this = this;
                var timer;
                if ('onwheel' in document) {
                    this._element.addEventListener('wheel', function(e) {
                        if (_this._enabled) {
                            var scrolled = _this._mouseWheelScroll(e.deltaY);
                            _this._stopEventConditionally(e, scrolled);
                            if (e.deltaMode == 1) {
                                _this.mouseWheelSpeed = 8;
                            }
                            _this._thumb.classList.add('scroll-active');
                            if (timer) {
                                clearTimeout(timer);
                            }
                            timer = setTimeout(function() {
                                _this._thumb.classList.remove('scroll-active');
                            }, scrollHideDelay);
                            e.stopPropagation();
                        }                        
                    });
                } else if ('onmousewheel' in document) {
                    this._element.addEventListener('mousewheel', function(e) {
                        if (_this._enabled) {
                            _this.mouseWheelSpeed = 0.15;
                            var scrolled = _this._mouseWheelScroll(-e.wheelDelta);
                            _this._stopEventConditionally(e, scrolled);
                            _this._thumb.classList.add('scroll-active');
                            if (timer) {
                                clearTimeout(timer);
                            }
                            timer = setTimeout(function() {
                                _this._thumb.classList.remove('scroll-active');
                            }, scrollHideDelay);
                        }

                    });
                }
            }
        },

        _mouseWheelScroll: {
            value: function(deltaY) {
                var delta = deltaY * this.mouseWheelSpeed;
                if (delta !== 0)
                    return this._scrollOverviewBy(delta);
            }
        },

        _scrollOverviewBy: {
            value: function(delta) {
                this.overviewPosition += delta;
                return this.scrollOverviewTo(this.overviewPosition);
            }
        },

        scrollOverviewTo: {
            value: function(overviewPositionNew) {
                overviewPositionNew = positionOrMax(overviewPositionNew, this._measurements.maxOverviewPosition);
                var oldScrollPercent = this._measurements.scrollPercent;
                this._measurements.scrollPercent = overviewPositionNew / this._measurements.maxOverviewPosition;
                if (oldScrollPercent != this._measurements.scrollPercent) {
                    var thumbPosition = this._measurements.scrollPercent * this._measurements.maxThumbPosition;
                    this.newThumbPosition = thumbPosition;
                    this.newOverviewPosition = overviewPositionNew;
                    if (!this.frameRequested) {
                        requestAnimationFrame(this._setScrollPosition.bind(this));
                        this.frameRequested = true;
                    }
                    return true;
                }
                else {
                    this.overviewPosition = positionOrMax(this.overviewPosition, this._measurements.maxOverviewPosition);
                    return false;
                }
            },
            enumerable: true
        },

        //if we scroll 'scrollable' element, parent is not scrolled
        //if there is nothing to scroll more in 'scrollable' element, parent is scrolled
        _stopEventConditionally: {
            value: function(e, condition) {
                if (condition || this.preventDefaultScroll) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        },

        _initTouchScrolling: {
            value: function() {
                var _this = this;
                var timer;
                this._overview.addEventListener('touchstart', function(e) {
                    if (_this._enabled) {
                        _this._startTouchScrolling(e);
                        _this._thumb.classList.add('scroll-active');
                        if (timer) {
                            clearTimeout(timer);
                        }
                    }
                });
                this._overview.addEventListener('touchmove', function(e) {
                    _this._touchScroll(e);
                });
                this._overview.addEventListener('touchend', function(e) {
                    _this._stopTouchScrolling(e);
                    timer = setTimeout(function() {
                        _this._thumb.classList.remove('scroll-active');
                    }, scrollHideDelay);
                });
            }
        },

        _startTouchScrolling: {
            value: function(e) {
                if (e.changedTouches) {
                    this.lastY = e.changedTouches[0].pageY;
                    this._touchScrolling = true;

                    velocity = amplitude = 0;
                    frame = this.newOverviewPosition;
                    timestamp = Date.now();
                    clearInterval(ticker);
                    ticker = setInterval(track, 48);

                    // e.stopPropagation();
                }
            }
        },

        _touchScroll: {
            value: function(e) {
                if (this._touchScrolling && e.changedTouches) {
                    var delta = (this.lastY - e.changedTouches[0].pageY) * this.touchScrollSpeed;                    
                    if (delta !== 0) {
                        var scrolled = this._scrollOverviewBy(delta);
                        if (scrolled) {
                            this.lastY = e.changedTouches[0].pageY;
                        }
                        this._stopEventConditionally(e, scrolled);
                    }                    
                }
            }
        },

        _stopTouchScrolling: {
            value: function(e) {
                if (this._touchScrolling) {
                    clearInterval(ticker);
                    if (velocity > 10 || velocity < -10) {
                        amplitude = 0.8 * velocity;
                        target = Math.round(this.newOverviewPosition + amplitude);
                        timestamp = Date.now();
                        autoScrollFrame = requestAnimationFrame(this._autoScroll.bind(this));
                    }
                }
                
                this._touchScrolling = false;
                //e.stopPropagation();
            }
        },

        _autoScroll: {
            value: function () {
                var elapsed, delta, timeConstant = 325;
                if (amplitude) {
                    elapsed = Date.now() - timestamp;
                    delta = -amplitude * Math.exp(-elapsed / timeConstant);
                    if (delta > 0.5 || delta < -0.5) {
                        this.scrollOverviewTo(target + delta);
                        autoScrollFrame = requestAnimationFrame(this._autoScroll.bind(this));
                    } else {
                        this.scrollOverviewTo(target);
                    }
                }
            }
        },

        _initPointerScrolling: {
            value: function() {
                var _this = this;
                var pointerScroll = function(e) {
                    _this._pointerScroll(e);
                };
                this._overview.addEventListener('pointerdown', function(e) {
                    if (_this._enabled)
                    {
                        _this._startPointerScrolling(e);
                        document.addEventListener('pointermove', pointerScroll);
                        _this._thumb.classList.add('scroll-active');
                        if (timer) {
                            clearTimeout(timer);
                        }
                    }                       
                });             
                this._overview.addEventListener('pointerup', function(e) {
                    _this._stopPointerScrolling(e);
                    document.removeEventListener('pointermove', pointerScroll);
                    timer = setTimeout(function() {
                        _this._thumb.classList.remove('scroll-active');
                    });
                });
            }
        },

        _startPointerScrolling: {
            value: function(e) {
                this.lastY = e.pageY;
                this._pointerScrolling = true;                
                // e.stopPropagation();
                // e.preventDefault();
            }
        },

        _pointerScroll: {
            value: function(e) {
                if (this._pointerScrolling) {
                    var delta = (this.lastY - e.pageY) * this.touchScrollSpeed;
                    var scrolled = this._scrollOverviewBy(delta);
                    if (scrolled) {
                        this.lastY = e.pageY;
                    }
                }
            }
        },

        _stopPointerScrolling: {
            value: function(e) {
                this._pointerScrolling = false;
                // e.stopPropagation();
            }
        },

        _initWindowResize: {
            value: function() {
                var _this = this;
                this.windowResize = function() {
                    _this._checkOverflow();
                    if (_this._enabled) {
                        _this._calculateHeights();
                        _this._keepScrollPosition();
                        _this._scrollbarTrack.classList.remove('display-none');
                    } else {
                        _this._calculateHeights();
                        _this._scrollbarTrack.classList.add('display-none');
                        _this.scrollOverviewTo(0);
                    }
                };
                window.addEventListener('resize', this.windowResize);
            }
        },

        _keepScrollPosition: {
            value: function() {
                var thumbPosition = this._measurements.scrollPercent * this._measurements.maxThumbPosition;
                var overviewPosition = this._measurements.scrollPercent * this._measurements.maxOverviewPosition;
                this.newOverviewPosition = overviewPosition;
                this.newThumbPosition = thumbPosition;
                if (!this.frameRequested) {
                        requestAnimationFrame(this._setScrollPosition.bind(this));
                        this.frameRequested = true;
                }
            }
        }
    });

    function track() {
        var now, elapsed, delta, v;

        now = Date.now();
        elapsed = now - timestamp;
        timestamp = now;
        delta = this.newOverviewPosition - frame;
        frame = this.newOverviewPosition;

        v = 1000 * delta / (1 + elapsed);
        velocity = 0.8 * v + 0.2 * velocity;
    }

    function positionOrMax(p, max) {
        if (p < 0) {
            return 0;
        } else {
            if (p > max)
            {
                return max;                
            } else {
                return p;
            }                
        }
    }

    // polyfill transform
    var transform = ["transform", "msTransform", "webkitTransform", "mozTransform", "oTransform"];   

    function getSupportedPropertyName(properties) {
        for (var i = 0; i < properties.length; i++) {
            if (typeof document.body.style[properties[i]] != "undefined") {
                return properties[i];
            }
        }
        return null;
    } 

    var transformProperty = getSupportedPropertyName(transform);


    global.createScrollbar = function(HTMLElement, options) {
        return new Scrollbar(HTMLElement, options);
    };

    return global;

}(global || {}));