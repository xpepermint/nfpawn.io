#!/bin/zsh
#
# NAUGHTY WORDS v1.0
#
# This script tests for the non-existance of specified "naughty patterns" in a
# git repository.
#

NAUGHTY_PATTERNS=(
  currency
) # This requires ZSH

for NAUGHTY_PATTERN in $NAUGHTY_PATTERNS; do
  echo "TESTING $NAUGHTY_PATTERN"
  git grep --ignore-case "$NAUGHTY_PATTERN" -- :/ | cat

  if [ $? != 1 ]; then
    exit 1
  fi
done