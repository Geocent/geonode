'use strict';

(function(){

  var module = angular.module('geonode_main_search', [], function($locationProvider) {
      if (window.navigator.userAgent.indexOf("MSIE") == -1){
          $locationProvider.html5Mode({
            enabled: true,
            requireBase: false
          });

          // make sure that angular doesn't intercept the page links
          angular.element("a").prop("target", "_self");
      }
    });

    // Used to set the class of the filters based on the url parameters
    module.set_initial_filters_from_query = function (data, url_query, filter_param){
        for(var i=0;i<data.length;i++){
            if( url_query == data[i][filter_param] || url_query.indexOf(data[i][filter_param] ) != -1){
                data[i].active = 'active';
            }else{
                data[i].active = '';
            }
        }
        return data;
    }

  // Load categories, keywords, and regions
  module.load_categories = function ($http, $rootScope, $location){
        var params = typeof FILTER_TYPE == 'undefined' ? {} : {'type': FILTER_TYPE};
        if ($location.search().hasOwnProperty('title__icontains')){
          params['title__icontains'] = $location.search()['title__icontains'];
        }
        $http.get(CATEGORIES_ENDPOINT, {params: params}).success(function(data){
            if($location.search().hasOwnProperty('category__identifier__in')){
                data.objects = module.set_initial_filters_from_query(data.objects,
                    $location.search()['category__identifier__in'], 'identifier');
            }
            $rootScope.categories = data.objects;
            if (HAYSTACK_FACET_COUNTS && $rootScope.query_data) {
                module.haystack_facets($http, $rootScope, $location);
            }
        });
    }
    
  module.load_keywords = function ($http, $rootScope, $location){
        var params = typeof FILTER_TYPE == 'undefined' ? {} : {'type': FILTER_TYPE};
        if ($location.search().hasOwnProperty('title__icontains')){
          params['title__icontains'] = $location.search()['title__icontains'];
        }
        $http.get(KEYWORDS_ENDPOINT, {params: params}).success(function(data){
            if($location.search().hasOwnProperty('keywords__slug__in')){
                data.objects = module.set_initial_filters_from_query(data.objects,
                    $location.search()['keywords__slug__in'], 'slug');
            }
            $rootScope.keywords = data.objects;
            if (HAYSTACK_FACET_COUNTS && $rootScope.query_data) {
                module.haystack_facets($http, $rootScope, $location);
            }
        });
    }
    
  module.load_regions = function ($http, $rootScope, $location){
        var params = typeof FILTER_TYPE == 'undefined' ? {} : {'type': FILTER_TYPE};
        if ($location.search().hasOwnProperty('title__icontains')){
          params['title__icontains'] = $location.search()['title__icontains'];
        }
        $http.get(REGIONS_ENDPOINT, {params: params}).success(function(data){
            if($location.search().hasOwnProperty('regions__name__in')){
                data.objects = module.set_initial_filters_from_query(data.objects,
                    $location.search()['regions__name__in'], 'name');
            }
            $rootScope.regions = data.objects;
            if (HAYSTACK_FACET_COUNTS && $rootScope.query_data) {
                module.haystack_facets($http, $rootScope, $location);
            }
        });
    }

  // Update facet counts for categories and keywords
  module.haystack_facets = function($http, $rootScope, $location) {
      var data = $rootScope.query_data;
      if ("categories" in $rootScope) {
          $rootScope.category_counts = data.meta.facets.category;
          for (var id in $rootScope.categories) {
              var category = $rootScope.categories[id];
              if (category.identifier in $rootScope.category_counts) {
                  category.count = $rootScope.category_counts[category.identifier]
              } else {
                  category.count = 0;
              }
          }
      }

      if ("keywords" in $rootScope) {
          $rootScope.keyword_counts = data.meta.facets.keywords;
          for (var id in $rootScope.keywords) {
              var keyword = $rootScope.keywords[id];
              if (keyword.slug in $rootScope.keyword_counts) {
                  keyword.count = $rootScope.keyword_counts[keyword.slug]
              } else {
                  keyword.count = 0;
              }
          }
      }	

      if ("regions" in $rootScope) {
          $rootScope.regions_counts = data.meta.facets.regions;
          for (var id in $rootScope.regions) {
              var region = $rootScope.regions[id];
              if (region.name in $rootScope.region_counts) {
                  region.count = $rootScope.region_counts[region.name]
              } else {
                  region.count = 0;
              }
          }
      }
  }

  /*
  * Load categories and keywords
  */
  module.run(function($http, $rootScope, $location){
    /*
    * Load categories and keywords if the filter is available in the page
    * and set active class if needed
    */
    if ($('#categories').length > 0){
       module.load_categories($http, $rootScope, $location);
    }
    if ($('#keywords').length > 0){
       module.load_keywords($http, $rootScope, $location);
    }
    if ($('#regions').length > 0){
       module.load_regions($http, $rootScope, $location);
    }

    // Activate the type filters if in the url
    if($location.search().hasOwnProperty('type__in')){
      var types = $location.search()['type__in'];
      if(types instanceof Array){
        for(var i=0;i<types.length;i++){
          $('body').find("[data-filter='type__in'][data-value="+types[i]+"]").addClass('active');
        }
      }else{
        $('body').find("[data-filter='type__in'][data-value="+types+"]").addClass('active');
      }
    }

    // Activate the sort filter if in the url
    if($location.search().hasOwnProperty('order_by')){
      var sort = $location.search()['order_by'];
      $('body').find("[data-filter='order_by']").removeClass('selected');
      $('body').find("[data-filter='order_by'][data-value="+sort+"]").addClass('selected');
    }

  });

  /*
  * Main search controller
  * Load data from api and defines the multiple and single choice handlers
  * Syncs the browser url with the selections
  */
  module.controller('geonode_search_controller', function($injector, $scope, $location, $http, Configs){
    $scope.query = $location.search();
    $scope.query.limit = $scope.query.limit || CLIENT_RESULTS_LIMIT;
    $scope.query.offset = $scope.query.offset || 0;
    $scope.page = Math.round(($scope.query.offset / $scope.query.limit) + 1);


    //Get data from apis and make them available to the page
    function query_api(data){
      return $http.get(Configs.url, {params: data || {}}).success(function(data){
        $scope.results = data.objects;
        $scope.total_counts = data.meta.total_count;
        $scope.$root.query_data = data;
        if (HAYSTACK_SEARCH) {
          if ($location.search().hasOwnProperty('q')){
            $scope.text_query = $location.search()['q'].replace(/\+/g," ");
          }
        } else {
          if ($location.search().hasOwnProperty('title__icontains')){
            $scope.text_query = $location.search()['title__icontains'].replace(/\+/g," ");
          }
        }

        //Update facet/keyword/category counts from search results
        if (HAYSTACK_FACET_COUNTS){
            module.haystack_facets($http, $scope.$root, $location);
            $("#types").find("a").each(function(){
                if ($(this)[0].id in data.meta.facets.subtype) {
                    $(this).find("span").text(data.meta.facets.subtype[$(this)[0].id]);
                }
                else if ($(this)[0].id in data.meta.facets.type) {
                    $(this).find("span").text(data.meta.facets.type[$(this)[0].id]);
                } else {
                    $(this).find("span").text("0");
                }
            });
        }
      });
    };
    query_api($scope.query);

    $scope.change_api = function(api_endpoint) {
      Configs.url = "/api/" + api_endpoint + "/";
      $scope.query.limit = 100;
      $scope.query.offset = 0;
      return query_api($scope.query).then(function(result) {
        return result;
      });
    }

    $scope.get_url = function() {
      return Configs.url;
    }

    /*
    * Pagination 
    */
    // Control what happens when the total results change
    $scope.$watch('total_counts', function(){
      $scope.numpages = Math.round(
        ($scope.total_counts / $scope.query.limit) + 0.49
      );

      // In case the user is viewing a page > 1 and a 
      // subsequent query returns less pages, then 
      // reset the page to one and search again.
      if($scope.numpages < $scope.page){
        $scope.page = 1;
        $scope.query.offset = 0;
        query_api($scope.query);
      }

      // In case of no results, the number of pages is one.
      if($scope.numpages == 0){$scope.numpages = 1};
    });

    $scope.paginate_down = function(){
      if($scope.page > 1){
        $scope.page -= 1;
        $scope.query.offset =  $scope.query.limit * ($scope.page - 1);
        query_api($scope.query);
      }   
    }

    $scope.paginate_up = function(){
      if($scope.numpages > $scope.page){
        $scope.page += 1;
        $scope.query.offset = $scope.query.limit * ($scope.page - 1);
        query_api($scope.query);
      }
    }
    /*
    * End pagination
    */


    if (!Configs.hasOwnProperty("disableQuerySync")) {
        // Keep in sync the page location with the query object
        $scope.$watch('query', function(){
          $location.search($scope.query);
        }, true);
    }

    /*
    * Add the selection behavior to the element, it adds/removes the 'active' class
    * and pushes/removes the value of the element from the query object
    */
    $scope.multiple_choice_listener = function($event){    
      var element = $($event.target);
      var query_entry = [];
      var data_filter = element.attr('data-filter');
      var value = element.attr('data-value');

      // If the query object has the record then grab it 
      if ($scope.query.hasOwnProperty(data_filter)){

        // When in the location are passed two filters of the same
        // type then they are put in an array otherwise is a single string
        if ($scope.query[data_filter] instanceof Array){
          query_entry = $scope.query[data_filter];
        }else{
          query_entry.push($scope.query[data_filter]);
        }     
      }

      // If the element is active active then deactivate it
      if(element.hasClass('active')){
        // clear the active class from it
        element.removeClass('active');

        // Remove the entry from the correct query in scope
        
        query_entry.splice(query_entry.indexOf(value), 1);
      }
      // if is not active then activate it
      else if(!element.hasClass('active')){
        // Add the entry in the correct query
        if (query_entry.indexOf(value) == -1){
          query_entry.push(value);  
        }         
        element.addClass('active');
      }

      //save back the new query entry to the scope query
      $scope.query[data_filter] = query_entry;

      //if the entry is empty then delete the property from the query
      if(query_entry.length == 0){
        delete($scope.query[data_filter]);
      }
      query_api($scope.query);
    }

    /*
    * Setting the query to a single element - replaces single_choice_listener
    */
    $scope.set_query = function(filter, value) {
      $scope.query = {};
      $scope.query[filter] = value;
      query_api($scope.query);
    }

    /*
    * Add the query, replacing any current query
    */
    $scope.add_single_query = function(filter, value) {
      $scope.query[filter] = value;
      query_api($scope.query);
    }

    /*
    * Add the query, appending it to any current query
    */
    $scope.add_query = function(filter, value) {
      var query_entry = [];
      if ($scope.query.hasOwnProperty(filter)) {
        if ($scope.query[filter] instanceof Array) {
          query_entry = $scope.query[filter];
        } else {
          query_entry.push($scope.query[filter]);
        }
        // Only add it if this value doesn't already exist
        // Apparently this doesn't exactly work...
        if ($scope.query[filter].indexOf(value) == -1) {
          query_entry.push(value);
        }
      } else {
        query_entry = [value];
      }
      $scope.query[filter] = query_entry;
      query_api($scope.query);
    }

    /*
    * Toggle adding/removing this filter
    */
    $scope.toggle_query = function(toggle, filter, value) {
      if (toggle) {
        $scope.add_query(filter, value);
      } else {
        $scope.remove_query(filter, value);
      }
    }

    /*
    * Remove the query
    */
    $scope.remove_query = function(filter, value) {
      var query_entry = [];
      // First check if this even exists to remove
      if ($scope.query.hasOwnProperty(filter)) {
        // Grab the current query
        if ($scope.query[filter] instanceof Array) {
          query_entry = $scope.query[filter];
        } else {
          query_entry.push($scope.query[filter]);
        }
        // Remove this value
        query_entry.splice(query_entry.indexOf(value), 1);
        // Update and run the query
        $scope.query[filter] = query_entry;
        query_api($scope.query);
      }
    }

    /*
    * Delete all parts of this filter
    */
    $scope.delete_query = function(filter) {
      // First check if this even exists to remove
      if ($scope.query.hasOwnProperty(filter)) {
        $scope.query[filter] = [];
        query_api($scope.query);
      }
    }

    $scope.add_search = function(filter, value, array) {
      if (array.indexOf(value) == -1) {
        array.push(value);
        $scope.add_query(filter, value);
      }
    }

    $scope.remove_search = function(filter, value, array) {
      var index = array.indexOf(value);
      if (index != -1) {
        array.splice(index, 1);
        $scope.remove_query(filter, value);
      }
    }


    var location_promise = function() {
      var highest = 1;
      var popular = {};
      // Query the users
      Configs.url = '/api/profiles/';
      $scope.query = {limit: 100, offset: 0};
      return query_api($scope.query).then(function() {
        var results = $scope.results;
        results.forEach(function(element) {
          if (popular[element.city] != null) {
            popular[element.city]++;
            if (highest < popular[element.city]) {
              highest = popular[element.city];
              $scope.most_popular_location = element.city;
            }
          } else {
            if (element.city != "" && element.city != null) {
              popular[element.city] = 1;
              if (highest == 1) {
                $scope.most_popular_location = element.city;
              }
            }
          }
        });
        // Query the groups
        Configs.url = '/api/groups/';
        $scope.query = {limit: 100, offset: 0};
        return query_api($scope.query).then(function() {
          var results = $scope.results;
          results.forEach(function(element) {
            if (popular[element.city] != null) {
              popular[element.city]++;
              if (highest < popular[element.city]) {
                highest = popular[element.city];
                $scope.most_popular_location = element.city;
              }
            } else {
              if (element.city != "" && element.city != null) {
                popular[element.city] = 1;
                if (highest == 1) {
                  $scope.most_popular_location = element.city;
                }
              }
            }
          });
          return results;
        });
      });
    }

    // Need to use both the users and groups api
    var calculate_most_popular_location = function() {
      // Store the current api requests
      var url = Configs.url;
      var query = $scope.query;

      // Calculate it and then return things to normal
      location_promise().then(function() {
        Configs.url = url;
        $scope.query = query;
        query_api($scope.query);
      });
    }

    var interest_promise = function() {
      var highest = 1;
      var popular = {};
      // Query the users
      Configs.url = '/api/profiles/';
      $scope.query = {limit: 100, offset: 0};
      return query_api($scope.query).then(function() {
        var results = $scope.results;
        results.forEach(function(element) {
          if (element.interests != null) {
            element.interests.forEach(function(interest) {
              if (popular[interest] != null) {
                popular[interest]++;
                if (highest < popular[interest]) {
                  highest = popular[interest]
                  $scope.most_popular_interest = interest;
                }
              } else {
                if (interest != "" && interest != null) {
                  popular[interest] = 1;
                  if (highest == 1) {
                    $scope.most_popular_interest = interest;
                  }
                }
              }
            });
          }
        });
        // Query the groups
        Configs.url = '/api/groups/';
        $scope.query = {limit: 100, offset: 0};
        return query_api($scope.query).then(function() {
          var results = $scope.results;
          results.forEach(function(element) {
            if (element.interests != null) {
              element.interests.forEach(function(interest) {
                if (popular[interest] != null) {
                  popular[interest]++;
                  if (highest < popular[interest]) {
                    highest = popular[interest]
                    $scope.most_popular_interest = interest;
                  }
                } else {
                  if (interest != "" && interest != null) {
                    popular[interest] = 1;
                    if (highest == 1) {
                      $scope.most_popular_interest = interest;
                    }
                  }
                }
              });
            }
          });
          return results;
        });
      });      
    }

    var calculate_most_popular_interest = function() {
      // Store the current api requests
      var url = Configs.url;
      var query = $scope.query;

      interest_promise().then(function() {
        Configs.url = url;
        $scope.query = query;
        query_api($scope.query);
      });
    }

    $scope.calculate_popular_items = function() {
      calculate_most_popular_interest();
      calculate_most_popular_location();
    }

    /*
    * Text search management
    */
    var text_autocomplete = $('#text_search_input').yourlabsAutocomplete({
          url: AUTOCOMPLETE_URL_RESOURCEBASE,
          choiceSelector: 'span',
          hideAfter: 200,
          minimumCharacters: 1,
          appendAutocomplete: $('#text_search_input'),
          placeholder: gettext('Enter your text here ...')
    });
    $('#text_search_input').bind('selectChoice', function(e, choice, text_autocomplete) {
          if(choice[0].children[0] == undefined) {

              var term = choice[0].innerHTML;

              $('#text_search_input').val(term);

              //ng-model is not updating when using jquery element.val()
              //This will force update the scope to keep in sync

               var model = $('#text_search_input').attr("ng-model");
                $scope[model] = term;
                $scope.$apply();

                $('#text_search_btn').click();
          }
    });

    $('#text_search_btn').click(function(){
        if (HAYSTACK_SEARCH)
            $scope.query['q'] = $('#text_search_input').val();
        else
            $scope.query['title__icontains'] = $('#text_search_input').val();
        query_api($scope.query);
    });

    /*
    * User search management
    */
    $('#user_search_input').bind('selectChoice', function(e, choice, text_autocomplete) {
          if(choice[0].children[0] == undefined) {

              var term = choice[0].innerHTML;

              $('#user_search_input').val(term);

              //ng-model is not updating when using jquery element.val()
              //This will force update the scope to keep in sync

               var model = $('#user_search_input').attr("ng-model");
                $scope[model] = term;
                $scope.$apply();

                $('#user_search_btn').click();
          }
    });

    $('#user_search_btn').click(function(){
        if (HAYSTACK_SEARCH)
            $scope.query['q'] = $('#user_search_input').val();
        else
            $scope.query['username'] = $('#user_search_input').val();
        query_api($scope.query);
    });

    /*
    * Region search management
    */
    var region_autocomplete = $('#region_search_input').yourlabsAutocomplete({
          url: AUTOCOMPLETE_URL_REGION,
          choiceSelector: 'span',
          hideAfter: 200,
          minimumCharacters: 1,
          appendAutocomplete: $('#region_search_input'),
          placeholder: gettext('Enter region here ...')
    });

    $('#region_search_input').bind('selectChoice', function(e, choice, region_autocomplete) {
          if(choice[0].children[0] == undefined) {
              $('#region_search_input').val(choice[0].innerHTML);
              $scope.region_query = choice[0].innerHTML;
          }
    });

    /*
    * Keyword search management
    */
    var keyword_autocomplete = $('#keyword_search_input').yourlabsAutocomplete({
          url: AUTOCOMPLETE_URL_KEYWORD,
          choiceSelector: 'span',
          hideAfter: 200,
          minimumCharacters: 1,
          appendAutocomplete: $('#keyword_search_input'),
          placeholder: gettext('Enter keyword here ...')
    });
    $('#keyword_search_input').bind('selectChoice', function(e, choice, keyword_autocomplete) {
          if(choice[0].children[0] == undefined) {
              $('#keyword_search_input').val(choice[0].innerHTML);
              $scope.keyword_query = choice[0].innerHTML;
          }
    });

    $scope.feature_select = function($event){
      var element = $($event.target);
      var article = $(element.parents('article')[0]);
      if (article.hasClass('resource_selected')){
        element.html('Select');
        article.removeClass('resource_selected');
      }
      else{
        element.html('Deselect');
        article.addClass('resource_selected');
      } 
    };

    /*
    * Date management
    */

    $scope.date_query = {
      'date__gte': '',
      'date__lte': ''
    };
    var init_date = true;
    $scope.$watch('date_query', function(){
      if($scope.date_query.date__gte != '' && $scope.date_query.date__lte != ''){
        $scope.query['date__range'] = $scope.date_query.date__gte + ',' + $scope.date_query.date__lte;
        delete $scope.query['date__gte'];
        delete $scope.query['date__lte'];
      }else if ($scope.date_query.date__gte != ''){
        $scope.query['date__gte'] = $scope.date_query.date__gte;
        delete $scope.query['date__range'];
        delete $scope.query['date__lte'];
      }else if ($scope.date_query.date__lte != ''){
        $scope.query['date__lte'] = $scope.date_query.date__lte;
        delete $scope.query['date__range'];
        delete $scope.query['date__gte'];
      }else{
        delete $scope.query['date__range'];
        delete $scope.query['date__gte'];
        delete $scope.query['date__lte'];
      }
      if (!init_date){
        query_api($scope.query);
      }else{
        init_date = false;
      }
      
    }, true);

    /*
    * Spatial search
    */
    if ($('.leaflet_map').length > 0) {
      angular.extend($scope, {
        layers: {
          baselayers: {
            stamen: {
              name: 'Toner Lite',
              type: 'xyz',
              url: 'http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png',
              layerOptions: {
                subdomains: ['a', 'b', 'c'],
                attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>',
                continuousWorld: true
              }
            }
          }
        },
        map_center: {
          lat: 5.6,
          lng: 3.9,
          zoom: 1
        },
        defaults: {
          zoomControl: false
        }
      });

      var leafletData = $injector.get('leafletData'),
          map = leafletData.getMap('filter-map');

      map.then(function(map){
        map.on('moveend', function(){
          $scope.query['extent'] = map.getBounds().toBBoxString();
          query_api($scope.query);
        });
      });
    }
  });
})();
