from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import Http404
from django.http import HttpResponse
from django.http import HttpResponseRedirect
from django.http import HttpResponseForbidden

from django.contrib.auth.models import User

import models

@login_required
def favorite(req, subject, id):
    if subject == 'map':
        obj = get_object_or_404(Map, pk = id)
    elif subject == 'layer':
        obj = get_object_or_404(Layer, pk = id)
    elif subject == 'user':
        obj = get_object_or_404(User, pk = id)
    models.Favorite.objects.create_favorite(obj, req.user)
    return HttpResponse('OK', status=200)

@login_required
def delete_favorite(req, id):
    models.Favorite.objects.get(user=req.user, pk=id).delete()
    return HttpResponse('OK', status=200)