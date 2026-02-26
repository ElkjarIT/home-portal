#!/bin/sh
curl -s "http://10.10.20.108:8123/api/states" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJiMWY3ZjA2YzM2ZDA0ZmJmODQ4OTZjNWE2OWQyYTY2YiIsImlhdCI6MTc3MTk2MzE3NSwiZXhwIjoyMDg3MzIzMTc1fQ.CXQqoEydta_NNkiWm25Pf1UoWQwCpv_FcTSv87pDwCU" \
  -o /tmp/ha_states.json

python3 /tmp/extract_entities.py
