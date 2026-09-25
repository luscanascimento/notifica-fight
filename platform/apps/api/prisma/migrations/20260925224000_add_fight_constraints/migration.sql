ALTER TABLE "Fight"
ADD CONSTRAINT "Fight_cardPosition_check"
CHECK ("cardPosition" > 0),
ADD CONSTRAINT "Fight_redCornerName_check"
CHECK (length(btrim("redCornerName")) > 0),
ADD CONSTRAINT "Fight_blueCornerName_check"
CHECK (length(btrim("blueCornerName")) > 0),
ADD CONSTRAINT "Fight_weightClass_check"
CHECK ("weightClass" IS NULL OR length(btrim("weightClass")) > 0);
