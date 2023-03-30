function SearchForm(options) {

    this.options = options;

    var self = this;

    this.resultScroll;

    this.DOM = {};
    this.DOM.searchContainer    = document.getElementById('search-container');
    this.DOM.searchForm         = this.DOM.searchContainer.querySelector('.search-form');
    this.DOM.searchInput        = this.DOM.searchContainer.querySelector('[name=search-query]');
    this.DOM.searchBtn          = this.DOM.searchContainer.querySelector('.js-search-btn');
    this.DOM.closeBtnPopup      = this.DOM.searchContainer.querySelector('.js-close-popup');
    this.DOM.queryWords         = this.DOM.searchContainer.querySelector('.query-words');
    this.DOM.searchResults      = this.DOM.searchContainer.querySelector('.search-results');

    // Listen search input
    this.DOM.searchInput.addEventListener('keyup', function(e) {
        self.showResult(e);
    });

    // Replace input value is choosed query word
    this.DOM.queryWords.addEventListener('click', function(e) {
        self.chooseQueryWord(e);
    });

    // Load results
    this.DOM.searchResults.addEventListener('click', function(e) {
        self.loadResults(e);
    });

    // Show search form
    this.DOM.searchBtn.addEventListener('click', function() {
        self.showForm();
        self.DOM.searchInput.focus();
    });

    // Hide search form when click outside form
    document.addEventListener('click', function(e) {
        var target = e.target;

        if (!self.DOM.searchContainer.contains(target)) {
            self.hideForm();
            self.hidePopup();
        }
    });

    this.DOM.closeBtnPopup.addEventListener('click', function() {
        self.hidePopup();
    });

    // if (global.createScrollbar) {
    //     this.resultScroll = global.createScrollbar(this.DOM.searchResults.parentElement, {
    //         touchScrollSpeed: 1,
    //         preventDefaultScroll: true
    //     });
    // }
};

SearchForm.prototype.showResult = function(e) {

    var value = e.target.value;

    if (value === '') {
        this.hidePopup();
        return null;
    } else {
        this.showPopup();
    }

    if (this.getSearchResultsTemp(value)) {
        this.DOM.searchResults.innerHTML = this.getSearchResultsTemp(value);
        // this.resultScroll.resize();
    } else {
        this.DOM.searchResults.innerHTML = '<li class="search-results__empty">No results :(</li>'
    }

    if (this.getSearchResultsTemp(value)) {
        this.DOM.queryWords.innerHTML = this.getQueryWordsTemp();
        // this.resultScroll.resize();
    } else {
        this.DOM.queryWords.innerHTML = '<li class="search-results__empty">No suggestions :(</li>'
    }

};

SearchForm.prototype.getQueryWordsTemp = function() {

    var queryTemp = '';
    var queryWords = jssearch.queryWords;

    // Don't find suggestions
    if (queryWords.length <= 0) {
        return null;
    }

    for (var i = 0, max = queryWords.length; i < max; i++) {

        if (i > 10) {
            break;
        }

        queryTemp += '<li class="query-word">' + queryWords[i] + '</li>';
    }

    return queryTemp;
};

SearchForm.prototype.getSearchResultsTemp = function(value) {

    if (!value) {
        console.error('value isn\'t correct data');
        return null;
    }

    var results = jssearch.search(value);

    // Don't find results
    if (results.length <= 0) {
        return null;
    }

    var resultTemp = '';
    var fileURL;

    for (var i = 0, max = results.length; i < max; i++) {

        if (i > 10) {
            break;
        }

        fileURL = results[i].file.url;

        resultTemp += '<li><a class="result-link" href="pages' + fileURL.slice('2') + '" data-link="pages' + fileURL.slice('2') + '">' + results[i].file.title + '</a></li>';
    }

    return resultTemp;
};

SearchForm.prototype.chooseQueryWord = function(e) {

    var target = e.target;

    if (target instanceof HTMLLIElement && target.classList.contains('query-word')) {

        this.DOM.searchInput.value       = target.innerHTML;
        this.DOM.searchResults.innerHTML = this.getSearchResultsTemp(this.DOM.searchInput.value);
    }
};

SearchForm.prototype.loadResults = function(e) {

    var target = e.target;

    if (target instanceof HTMLAnchorElement && target.classList.contains('result-link')) {

        e.preventDefault();

        this.hideForm();
        this.hidePopup();

        this.DOM.searchInput.value = '';

        this.options.callback();

        global.documentation.loadPage(target.href.slice(target.href.lastIndexOf('pages/')), target);
    }
};

SearchForm.prototype.showPopup = function() {

    if (!this.DOM.searchContainer.classList.contains('show-popup')) {
        this.DOM.searchContainer.classList.add('show-popup');
    }
};

SearchForm.prototype.hidePopup = function() {

    if (this.DOM.searchContainer.classList.contains('show-popup')) {
        this.DOM.searchContainer.classList.remove('show-popup');
    }
}

SearchForm.prototype.showForm = function() {

    if (!this.DOM.searchContainer.classList.contains('show-form')) {
        this.DOM.searchContainer.classList.add('show-form');
    }
};

SearchForm.prototype.hideForm = function() {

    if (this.DOM.searchContainer.classList.contains('show-form')) {
        this.DOM.searchContainer.classList.remove('show-form');
    }
}
