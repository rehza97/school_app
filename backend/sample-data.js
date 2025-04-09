const { db } = require("./db");

// Sample data for education level (السنة - level of student)
const educationLevels = [
  {
    name: "السنة الأولى ابتدائي",
    description: "المستوى الأول من التعليم الابتدائي",
  },
  {
    name: "السنة الثانية ابتدائي",
    description: "المستوى الثاني من التعليم الابتدائي",
  },
  {
    name: "السنة الثالثة ابتدائي",
    description: "المستوى الثالث من التعليم الابتدائي",
  },
  {
    name: "السنة الرابعة ابتدائي",
    description: "المستوى الرابع من التعليم الابتدائي",
  },
  {
    name: "السنة الخامسة ابتدائي",
    description: "المستوى الخامس من التعليم الابتدائي",
  },
  {
    name: "السنة السادسة ابتدائي",
    description: "المستوى السادس من التعليم الابتدائي",
  },
  {
    name: "السنة الأولى متوسط",
    description: "المستوى الأول من التعليم المتوسط",
  },
  {
    name: "السنة الثانية متوسط",
    description: "المستوى الثاني من التعليم المتوسط",
  },
  {
    name: "السنة الثالثة متوسط",
    description: "المستوى الثالث من التعليم المتوسط",
  },
  {
    name: "السنة الرابعة متوسط",
    description: "المستوى الرابع من التعليم المتوسط",
  },
  {
    name: "السنة الأولى ثانوي",
    description: "المستوى الأول من التعليم الثانوي",
  },
  {
    name: "السنة الثانية ثانوي",
    description: "المستوى الثاني من التعليم الثانوي",
  },
  {
    name: "السنة الثالثة ثانوي",
    description: "المستوى الثالث من التعليم الثانوي",
  },
];

// Sample data for specialty (الشعبة - specialty)
const specialties = [
  { name: "آداب وفلسفة", description: "تخصص الآداب والفلسفة" },
  { name: "علوم تجريبية", description: "تخصص العلوم التجريبية" },
  { name: "رياضيات", description: "تخصص الرياضيات" },
  { name: "تقني رياضي", description: "تخصص التقني الرياضي" },
  { name: "لغات أجنبية", description: "تخصص اللغات الأجنبية" },
  { name: "عام", description: "تعليم عام (للمراحل الابتدائية والمتوسطة)" },
];

// Sample data for education system (نظام التمدرس - intern/extern)
const educationSystems = [
  { name: "داخلي", description: "طالب مقيم في المدرسة (داخلي)" },
  { name: "خارجي", description: "طالب غير مقيم في المدرسة (خارجي)" },
  { name: "نصف داخلي", description: "طالب يبقى في المدرسة خلال النهار فقط" },
];

// Sample subjects data
const subjects = [
  { name: "الرياضيات", description: "دروس الرياضيات والجبر والهندسة" },
  { name: "اللغة العربية", description: "تدريس قواعد اللغة العربية والأدب" },
  { name: "اللغة الإنجليزية", description: "تدريس اللغة الإنجليزية" },
  { name: "العلوم", description: "دروس الفيزياء والكيمياء والأحياء" },
  { name: "التاريخ", description: "دراسة التاريخ والحضارات" },
  { name: "الجغرافيا", description: "دراسة الجغرافيا" },
  { name: "التربية الإسلامية", description: "تعليم أساسيات الدين الإسلامي" },
  { name: "التربية الفنية", description: "دروس الفن والرسم" },
  { name: "التربية البدنية", description: "الرياضة والتربية البدنية" },
];

// Sample class schedules
const generateClassSchedules = (teacherCount, sectionCount, subjectCount) => {
  const schedules = [];

  // Create a schedule for each day of the week
  for (let day = 1; day <= 5; day++) {
    // Morning classes (8 AM to 1 PM)
    for (let hour = 8; hour <= 13; hour++) {
      // For each section
      for (let section = 1; section <= sectionCount; section++) {
        const teacherId = Math.floor(Math.random() * teacherCount) + 1;
        const subjectId = Math.floor(Math.random() * subjectCount) + 1;

        schedules.push({
          section_id: section,
          teacher_id: teacherId,
          subject_id: subjectId,
          day_of_week: day,
          start_time: `${hour}:00`,
          end_time: `${hour}:50`,
          room: `قاعة ${section}${String.fromCharCode(64 + hour - 7)}`,
        });
      }
    }
  }

  return schedules;
};

// Function to insert sample data
const insertSampleData = async () => {
  console.log("Starting to insert sample data...");

  try {
    // Begin transaction
    db.run("BEGIN TRANSACTION");

    // Insert education levels
    console.log("Inserting education levels...");
    for (const level of educationLevels) {
      db.run(
        "INSERT OR IGNORE INTO education_level (name, description) VALUES (?, ?)",
        [level.name, level.description],
        function (err) {
          if (err) {
            console.error("Error adding education level:", err);
          } else {
            console.log(`Added education level: ${level.name}`);
          }
        }
      );
    }

    // Insert specialties
    console.log("Inserting specialties...");
    for (const specialty of specialties) {
      db.run(
        "INSERT OR IGNORE INTO specialty (name, description) VALUES (?, ?)",
        [specialty.name, specialty.description],
        function (err) {
          if (err) {
            console.error("Error adding specialty:", err);
          } else {
            console.log(`Added specialty: ${specialty.name}`);
          }
        }
      );
    }

    // Insert education systems
    console.log("Inserting education systems...");
    for (const system of educationSystems) {
      db.run(
        "INSERT OR IGNORE INTO education_system (name, description) VALUES (?, ?)",
        [system.name, system.description],
        function (err) {
          if (err) {
            console.error("Error adding education system:", err);
          } else {
            console.log(`Added education system: ${system.name}`);
          }
        }
      );
    }

    // Insert subjects
    for (const subject of subjects) {
      console.log(`Adding subject: ${subject.name}`);
      db.run(
        "INSERT OR IGNORE INTO subjects (name, description) VALUES (?, ?)",
        [subject.name, subject.description],
        function (err) {
          if (err) {
            console.error("Error adding subject:", err);
          } else {
            console.log(
              `Added subject ${subject.name} with ID ${
                this.lastID || "existing"
              }`
            );
          }
        }
      );
    }

    // Get teacher and section counts for generating schedules
    db.get(
      "SELECT COUNT(*) as count FROM teachers",
      [],
      (err, teacherResult) => {
        if (err) {
          console.error("Error counting teachers:", err);
          db.run("ROLLBACK");
          return;
        }

        const teacherCount = teacherResult.count || 1;

        db.get(
          "SELECT COUNT(*) as count FROM sections",
          [],
          (err, sectionResult) => {
            if (err) {
              console.error("Error counting sections:", err);
              db.run("ROLLBACK");
              return;
            }

            const sectionCount = sectionResult.count || 1;

            db.get(
              "SELECT COUNT(*) as count FROM subjects",
              [],
              (err, subjectResult) => {
                if (err) {
                  console.error("Error counting subjects:", err);
                  db.run("ROLLBACK");
                  return;
                }

                const subjectCount = subjectResult.count || subjects.length;

                // Generate and insert class schedules
                const schedules = generateClassSchedules(
                  teacherCount,
                  sectionCount,
                  subjectCount
                );

                let insertedSchedules = 0;

                for (const schedule of schedules) {
                  db.run(
                    `INSERT OR IGNORE INTO class_schedule 
               (section_id, teacher_id, subject_id, day_of_week, start_time, end_time, room) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                      schedule.section_id,
                      schedule.teacher_id,
                      schedule.subject_id,
                      schedule.day_of_week,
                      schedule.start_time,
                      schedule.end_time,
                      schedule.room,
                    ],
                    function (err) {
                      if (err) {
                        console.error("Error adding class schedule:", err);
                      } else {
                        insertedSchedules++;
                      }

                      // If this is the last schedule, commit the transaction
                      if (insertedSchedules === schedules.length) {
                        db.run("COMMIT", (err) => {
                          if (err) {
                            console.error("Error committing transaction:", err);
                            db.run("ROLLBACK");
                            return;
                          }

                          console.log(
                            `Successfully inserted ${insertedSchedules} class schedules.`
                          );
                        });
                      }
                    }
                  );
                }
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error("Error inserting sample data:", error);
    db.run("ROLLBACK");
  }
};

// Run the insertion
insertSampleData();
