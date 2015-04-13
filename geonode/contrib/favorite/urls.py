from django.conf.urls.defaults import *

urlpatterns += patterns('',
    url(r'^favorite/map/(?P<id>\d+)$','favorite',{'subject':'map'}, name='add_favorite_map'),
    url(r'^favorite/layer/(?P<id>\d+)$','favorite',{'subject':'layer'}, name='add_favorite_layer'),
    url(r'^favorite/user/(?P<id>\d+)$','favorite',{'subject':'user'}, name='add_favorite_user'),
    url(r'^favorite/(?P<id>\d+)/delete$','delete_favorite',name='delete_favorite'),
    url(r'^mapstory/publish/(?P<layer_or_map>\w+)/(?P<layer_or_map_id>\d+)$','publish_status',name='publish_status'),
    url(r'^mapstory/add-to-map/(?P<id>\d+)/(?P<typename>[:\w]+)','add_to_map',name='add_to_map'),
    url(r'^search/favoriteslinks$','favoriteslinks',name='favoriteslinks'),
    url(r'^search/favoriteslist$','favoriteslist',name='favoriteslist'),
    )