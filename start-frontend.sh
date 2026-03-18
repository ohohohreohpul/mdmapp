#!/bin/bash
cd "$(dirname "$0")/frontend"
exec yarn web --port 8081
