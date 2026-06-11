#!/bin/bash

mkdir -p backups

cp data/students.json backups/students-$(date +%Y%m%d-%H%M).json
cp data/checkins.json backups/checkins-$(date +%Y%m%d-%H%M).json

git add data backups
git commit -m "Backup automatico dos dados $(date +%Y-%m-%d-%H:%M)" || true
git push

echo "Backup concluído com sucesso!"
