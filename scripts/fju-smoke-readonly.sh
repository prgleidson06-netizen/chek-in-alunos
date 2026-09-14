#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
PASSWORD="${ADMIN_PASSWORD:-fju2024}"
COOKIE_FILE="$(mktemp -t fju-smoke-cookie.XXXXXX)"
STUDENT_ID="${FJU_TEST_STUDENT_ID:-vo7k7e80tflmqkzn6tx}"
TEACHER_ID="${FJU_TEST_TEACHER_ID:-teacher-5157ab48-85f5-4a28-bce2-e6b73589c8c4}"

cleanup() {
  rm -f "$COOKIE_FILE"
}
trap cleanup EXIT

request_status() {
  local url="$1"
  curl -s -b "$COOKIE_FILE" -o /tmp/fju-smoke-body.txt -w "%{http_code}" "$BASE_URL$url"
}

echo "[1/5] Login admin"
login_status="$(curl -s -o /tmp/fju-smoke-login.txt -w "%{http_code}" -c "$COOKIE_FILE" \
  -X POST "$BASE_URL/api/admin-session" \
  -H "Content-Type: application/json" \
  --data "{\"password\":\"$PASSWORD\"}")"
echo "login -> HTTP $login_status"
test "$login_status" = "200"

echo "[2/5] Paginas principais"
for path in \
  "/" \
  "/matricula" \
  "/professor-voluntario" \
  "/professor-voluntario/novo" \
  "/professor-aulas" \
  "/professor-checkin" \
  "/id-card/$STUDENT_ID" \
  "/student-print/$STUDENT_ID" \
  "/teacher-card/$TEACHER_ID" \
  "/teacher-print/$TEACHER_ID"
do
  status="$(request_status "$path")"
  echo "$path -> HTTP $status"
  test "$status" = "200"
done

echo "[3/5] APIs de leitura"
for path in "/api/students" "/api/teachers" "/api/weekly-report"
do
  status="$(request_status "$path")"
  echo "$path -> HTTP $status"
  test "$status" = "200"
done

echo "[4/5] Quantidades"
curl -s -b "$COOKIE_FILE" "$BASE_URL/api/students" -o /tmp/fju-smoke-students.json
curl -s "$BASE_URL/api/teachers" -o /tmp/fju-smoke-teachers.json
node <<'NODE'
const fs = require('fs')
const studentsResponse = JSON.parse(fs.readFileSync('/tmp/fju-smoke-students.json', 'utf8'))
const teachersResponse = JSON.parse(fs.readFileSync('/tmp/fju-smoke-teachers.json', 'utf8'))
const students = Array.isArray(studentsResponse) ? studentsResponse : studentsResponse.students || []
const teachers = Array.isArray(teachersResponse) ? teachersResponse : teachersResponse.teachers || []
console.log(`alunos=${students.length}`)
console.log(`professores=${teachers.length}`)
if (students.length < 1) process.exitCode = 1
if (teachers.length < 1) process.exitCode = 1
NODE

echo "[5/5] Foto de aluno"
curl -s -L -o /tmp/fju-smoke-photo.bin -w "foto -> HTTP %{http_code} bytes %{size_download} type %{content_type}\n" \
  "$BASE_URL/api/student-photo/$STUDENT_ID?v=smoke"
file /tmp/fju-smoke-photo.bin

echo "OK: teste read-only aprovado. Nenhum aluno/professor foi criado, editado ou deletado."
