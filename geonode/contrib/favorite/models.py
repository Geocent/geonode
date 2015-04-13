from django.db import models

from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes import generic

from django.contrib.auth.models import User

class FavoriteManager(models.Manager):

    def favorites_for_user(self, user):
        return self.filter(user=user)

    def _favorite_ct_for_user(self, user, model):
        content_type = ContentType.objects.get_for_model(model)
        return self.favorites_for_user(user).filter(content_type=content_type).prefetch_related('content_object')

    def favorite_maps_for_user(self, user):
        return self._favorite_ct_for_user(user, Map)

    def favorite_layers_for_user(self, user):
        return self._favorite_ct_for_user(user, Layer)

    def favorite_users_for_user(self, user):
        return self._favorite_ct_for_user(user, User)

    def bulk_favorite_objects(self, user):
        'get the actual favorite objects for a user as a dict by content_type'
        favs = {}
        for m in (Map, Layer, User):
            ct = ContentType.objects.get_for_model(m)
            f = self.favorites_for_user(user).filter(content_type=ct)
            favs[ct.name] = m.objects.filter(id__in = f.values('object_id'))
        return favs

    def create_favorite(self, content_object, user):
        content_type = ContentType.objects.get_for_model(type(content_object))
        favorite, _ = self.get_or_create(
            user=user,
            content_type=content_type,
            object_id=content_object.pk,
            )
        return favorite


class Favorite(models.Model):
    user = models.ForeignKey(User)
    content_type = models.ForeignKey(ContentType)
    object_id = models.PositiveIntegerField()
    content_object = generic.GenericForeignKey('content_type', 'object_id')

    created_on = models.DateTimeField(auto_now_add=True)

    objects = FavoriteManager()

    class Meta:
        verbose_name = 'favorite'
        verbose_name_plural = 'favorites'
        unique_together = (('user', 'content_type', 'object_id'),)

    def __unicode__(self):
        return "%s likes %s" % (self.user, self.content_object)