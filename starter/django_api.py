#!/usr/bin/env python3
"""
ITENT 45 - starter API, Django.

The endpoints you designed in Breakout 2, implemented. One file so the whole
thing fits on a projector; a real project splits this across settings, urls,
models and views, and nothing else changes.

    pip install django
    python3 django_api.py migrate
    python3 django_api.py runserver 8000

Then:

    curl localhost:8000/api/courses
    curl -X POST localhost:8000/api/enrollments \
         -H 'Content-Type: application/json' \
         -H 'Idempotency-Key: abc-123' \
         -d '{"student":"20-1234","code":"ITENT 45"}'

Send that POST twice with the same key. Then send it twice without one.
That difference is panel 07, and it is the whole reason the header exists.
"""
import json
import os
import sys

import django
from django.conf import settings
from django.core.management import execute_from_command_line
from django.db import IntegrityError, models, transaction
from django.http import JsonResponse
from django.urls import path
from django.views.decorators.csrf import csrf_exempt

BASE = os.path.dirname(os.path.abspath(__file__))

if not settings.configured:
    settings.configure(
        DEBUG=True,
        SECRET_KEY="not-a-secret-this-is-a-teaching-file",
        ALLOWED_HOSTS=["*"],
        ROOT_URLCONF=__name__,
        DATABASES={
            "default": {
                "ENGINE": "django.db.backends.sqlite3",
                "NAME": os.path.join(BASE, "itent45.sqlite3"),
            }
        },
        INSTALLED_APPS=["django.contrib.contenttypes", "django.contrib.auth", __name__],
        DEFAULT_AUTO_FIELD="django.db.models.AutoField",
    )
    django.setup()


# ---------------------------------------------------------------- models
class Course(models.Model):
    code = models.CharField(max_length=16, unique=True)
    title = models.CharField(max_length=120)
    units = models.IntegerField(default=3)
    slots = models.IntegerField(default=0)

    class Meta:
        app_label = __name__

    def as_dict(self):
        return {"code": self.code, "title": self.title,
                "units": self.units, "slots": self.slots}


class Enrollment(models.Model):
    student = models.CharField(max_length=16)
    course = models.ForeignKey(Course, on_delete=models.CASCADE,
                               related_name="enrollments")
    # One student cannot hold two seats in the same course. The database
    # enforces this, not your view. Panel 11's seat race is decided here.
    class Meta:
        app_label = __name__
        constraints = [
            models.UniqueConstraint(fields=["student", "course"],
                                    name="one_seat_per_student_per_course")
        ]

    def as_dict(self):
        return {"id": self.id, "student": self.student,
                "course": self.course.code, "units": self.course.units}


class IdempotencyKey(models.Model):
    """Remembers what a key already produced, so a retry replays the first
    answer instead of doing the work twice. Panel 07, made concrete."""
    key = models.CharField(max_length=80, unique=True)
    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE)

    class Meta:
        app_label = __name__


# ---------------------------------------------------------------- helpers
def body_of(request):
    if not request.body:
        return {}
    try:
        return json.loads(request.body)
    except json.JSONDecodeError:
        return None                      # caller turns this into a 400


def not_allowed(allowed):
    # 405 carries an Allow header. Panel 05's greyed-out matrix cells.
    r = JsonResponse({"error": "method not allowed"}, status=405)
    r["Allow"] = ", ".join(allowed)
    return r


# ---------------------------------------------------------------- views
@csrf_exempt
def courses(request):
    if request.method == "GET":
        rows = [c.as_dict() for c in Course.objects.all().order_by("code")]
        return JsonResponse({"courses": rows})

    if request.method == "POST":
        data = body_of(request)
        if data is None:
            return JsonResponse({"error": "body is not valid JSON"}, status=400)
        if not data.get("code"):
            return JsonResponse({"error": "code is required"}, status=422)
        if Course.objects.filter(code=data["code"]).exists():
            return JsonResponse({"error": "that course already exists"}, status=409)
        c = Course.objects.create(
            code=data["code"], title=data.get("title", ""),
            units=data.get("units", 3), slots=data.get("slots", 0))
        # 201 says where the new thing lives.
        r = JsonResponse(c.as_dict(), status=201)
        r["Location"] = f"/api/courses/{c.code}"
        return r

    return not_allowed(["GET", "POST"])


@csrf_exempt
def course_detail(request, code):
    try:
        c = Course.objects.get(code=code)
    except Course.DoesNotExist:
        return JsonResponse({"error": "no course with that code"}, status=404)

    if request.method == "GET":
        return JsonResponse(c.as_dict())

    if request.method == "PUT":
        # PUT replaces. Fields you leave out are not preserved - they are
        # overwritten with defaults, because you asked for a replacement.
        data = body_of(request)
        if data is None:
            return JsonResponse({"error": "body is not valid JSON"}, status=400)
        c.title = data.get("title", "")
        c.units = data.get("units", 3)
        c.slots = data.get("slots", 0)
        c.save()
        return JsonResponse(c.as_dict())

    if request.method == "PATCH":
        # PATCH changes only what you sent. This is why it exists.
        data = body_of(request)
        if data is None:
            return JsonResponse({"error": "body is not valid JSON"}, status=400)
        for field in ("title", "units", "slots"):
            if field in data:
                setattr(c, field, data[field])
        c.save()
        return JsonResponse(c.as_dict())

    if request.method == "DELETE":
        c.delete()
        # Nothing to say. Say nothing, with a 204.
        return JsonResponse({}, status=204, safe=False)

    return not_allowed(["GET", "PUT", "PATCH", "DELETE"])


@csrf_exempt
def enrollments(request):
    if request.method == "GET":
        student = request.GET.get("student")
        qs = Enrollment.objects.select_related("course")   # <- one query, not N+1
        if student:
            qs = qs.filter(student=student)
        return JsonResponse({"enrollments": [e.as_dict() for e in qs]})

    if request.method == "POST":
        data = body_of(request)
        if data is None:
            return JsonResponse({"error": "body is not valid JSON"}, status=400)

        idem = request.headers.get("Idempotency-Key")
        if idem:
            existing = IdempotencyKey.objects.filter(key=idem).select_related(
                "enrollment__course").first()
            if existing:
                # Same key seen before: replay the original answer.
                return JsonResponse(existing.enrollment.as_dict(), status=200)

        try:
            course = Course.objects.get(code=data.get("code", ""))
        except Course.DoesNotExist:
            return JsonResponse({"error": "no course with that code"}, status=404)

        if course.slots < 1:
            return JsonResponse({"error": "no slots left"}, status=409)

        try:
            with transaction.atomic():
                e = Enrollment.objects.create(student=data.get("student", ""),
                                              course=course)
                course.slots -= 1
                course.save()
                if idem:
                    IdempotencyKey.objects.create(key=idem, enrollment=e)
        except IntegrityError:
            # Two requests raced for the same seat. One of them lands here.
            return JsonResponse({"error": "already enrolled in that course"},
                                status=409)

        r = JsonResponse(e.as_dict(), status=201)
        r["Location"] = f"/api/enrollments/{e.id}"
        return r

    return not_allowed(["GET", "POST"])


@csrf_exempt
def enrollment_detail(request, pk):
    if request.method == "DELETE":
        try:
            e = Enrollment.objects.select_related("course").get(pk=pk)
        except Enrollment.DoesNotExist:
            # Already gone. The end state is what you wanted, so this is
            # not an error the caller has to handle - but it is a 404.
            return JsonResponse({"error": "no such enrollment"}, status=404)
        e.course.slots += 1
        e.course.save()
        e.delete()
        return JsonResponse({}, status=204, safe=False)

    return not_allowed(["DELETE"])


urlpatterns = [
    path("api/courses", courses),
    path("api/courses/<str:code>", course_detail),
    path("api/enrollments", enrollments),
    path("api/enrollments/<int:pk>", enrollment_detail),
]


# ---------------------------------------------------------------- seed
def seed():
    if Course.objects.exists():
        return
    Course.objects.bulk_create([
        Course(code="ITENT 45", title="Application Dev & Emerging Tech",
               units=3, slots=4),
        Course(code="CSCI 21", title="Data Structures", units=3, slots=0),
        Course(code="ITMGT 25", title="Programming Fundamentals",
               units=3, slots=12),
    ])
    print("seeded 3 courses")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "migrate":
        # A single-file app has no migrations folder, so build the tables
        # straight from the model definitions.
        from django.db import connection
        existing = set(connection.introspection.table_names())
        with connection.schema_editor() as schema:
            for model in (Course, Enrollment, IdempotencyKey):
                if model._meta.db_table not in existing:
                    schema.create_model(model)
                    print("created", model._meta.db_table)
        seed()
    else:
        execute_from_command_line(sys.argv)
