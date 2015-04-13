from django.core.urlresolvers import reverse

from django import template
from django.template import loader, Variable, VariableDoesNotExist

from models import Favorite

register = template.Library()

@register.tag
def favorites(parse, token):
    try:
        tokens = token.split_contents()
        tag_name = tokens.pop(0)
    except ValueError:
        raise template.TemplateSyntaxError, "%r tag requires a single argument" % token.contents.split()[0]
    return FavoritesNode()

class FavoritesNode(template.Node):
    def render(self, context):
        template_name = "mapstory/_widget_favorites.html"
        user = context['user']
        maps = PublishingStatus.objects.get_in_progress(user,Map)
        layers = PublishingStatus.objects.get_in_progress(user,Layer)
        ctx = {
            "favorites" : Favorite.objects.favorites_for_user(user),
            "in_progress_maps" : maps,
            "in_progress_layers" : layers
        }
        return loader.render_to_string(template_name,ctx)


@register.simple_tag
def add_to_favorites(obj):
    template = '<a class="add-to-favorites btn btn-mini" href="%s"><i class="icon-heart"></i>%s</a>'
    obj_name = type(obj).__name__.lower()
    url = "add_favorite_%s" % obj_name
    url = reverse(url, args=[obj.pk])
    text = "Add to Favorites"
    return template % (url,text)
