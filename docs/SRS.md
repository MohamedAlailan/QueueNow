# Software Requirements Specification (SRS)

## QueueNow Clinic Management System

**Project Name:** QueueNow Clinic
**Document Type:** Software Requirements Specification (SRS)
**Version:** 1.0
**Project Scope:** Minimum Viable Product (MVP)
**Platform:** Web Application
**Development Duration:** 1 Week
**Prepared By:** QueueNow Project Team
**Date:** September 2026

---

# 1. Introduction

## 1.1 Purpose

يهدف هذا المستند إلى تحديد المتطلبات الوظيفية وغير الوظيفية لنظام **QueueNow Clinic Management System**.

QueueNow هو نظام ويب لإدارة العمليات الأساسية داخل العيادة الطبية، ويهدف إلى تنظيم المواعيد والطوابير وإدارة بيانات المرضى والزيارات الطبية، مع توفير لوحات تحكم مناسبة لكل نوع من المستخدمين.

يمثل هذا المستند المرجع الأساسي لفريق المشروع أثناء مراحل التصميم والتطوير والاختبار.

---

## 1.2 Product Vision

يسعى QueueNow إلى توفير طريقة رقمية بسيطة وفعالة لإدارة رحلة المريض داخل العيادة، بدءًا من حجز الموعد وحتى انتهاء الزيارة الطبية.

النظام المقترح:

**Patient → Appointment → Check-In → Queue → Doctor Consultation → Medical Visit → Completion**

---

## 1.3 Scope

يشمل الإصدار الأول من النظام الوظائف الأساسية التالية:

* Authentication and Authorization.
* Patient Management.
* Doctor Management.
* Appointment Management.
* Queue Management.
* Medical Visit Management.
* Prescription Management.
* Basic Notifications.
* Basic Dashboard and Reports.
* Limited AI-assisted features.

الإصدار الأول مخصص لعيادة واحدة، ويهدف إلى تقديم MVP يعمل بشكل متكامل وقابل للتوسع مستقبلًا.

---

## 1.4 Out of Scope

لن تشمل النسخة الأولى:

* تطبيق Mobile مستقل.
* إدارة عدة فروع للعيادة.
* التكامل مع شركات التأمين.
* التكامل مع المختبرات والصيدليات.
* بوابات دفع إلكترونية.
* رسائل SMS أو WhatsApp.
* الاستشارات الطبية عبر الفيديو.
* نظام سجلات طبية متقدم بالكامل.
* التشخيص الطبي الآلي.
* وصف الأدوية تلقائيًا بواسطة AI.
* تدريب نماذج ذكاء اصطناعي متقدمة من الصفر.

يمكن إضافة هذه الوظائف في إصدارات مستقبلية.

---

# 2. Problem Statement

تعتمد بعض العيادات على أساليب يدوية أو أنظمة غير مترابطة لإدارة المرضى والمواعيد والطوابير، مما قد يؤدي إلى:

* ازدحام منطقة الانتظار.
* صعوبة متابعة المواعيد.
* زيادة وقت الانتظار.
* صعوبة الوصول إلى بيانات المريض.
* تكرار إدخال البيانات.
* صعوبة متابعة حالة الزيارة.
* ضعف القدرة على استخراج التقارير.

يهدف QueueNow إلى توفير نظام مركزي يساعد على تنظيم هذه العمليات وتحسين تجربة المريض والموظفين.

---

# 3. Objectives

## 3.1 Primary Objectives

1. رقمنة العمليات الأساسية في العيادة.
2. تنظيم حجز وإدارة المواعيد.
3. إدارة الطوابير إلكترونيًا.
4. تحسين تجربة المريض.
5. توفير وصول منظم إلى المعلومات الطبية.
6. مساعدة الطبيب في إدارة الزيارات.
7. توفير لوحة تحكم للإدارة.
8. توفير بيانات يمكن استخدامها في التحليلات.
9. تجربة استخدام بعض تقنيات AI بشكل آمن ومحدود.

---

# 4. Stakeholders

## 4.1 Patients

الأشخاص الذين يزورون العيادة ويستخدمون النظام لحجز المواعيد ومتابعة الزيارة.

## 4.2 Doctors

الأطباء الذين يقومون بفحص المرضى وإدخال معلومات الزيارة والوصفات الطبية.

## 4.3 Receptionists

موظفو الاستقبال المسؤولون عن المواعيد وتسجيل وصول المرضى وإدارة الطابور.

## 4.4 Administrators

المستخدمون المسؤولون عن إدارة النظام والمستخدمين والأطباء والخدمات والتقارير.

## 4.5 Clinic Management

إدارة العيادة التي تستفيد من البيانات والإحصائيات لمتابعة أداء العيادة.

---

# 5. User Roles

يحتوي النظام على أربعة أدوار رئيسية:

| Role         | Description                                   |
| ------------ | --------------------------------------------- |
| Patient      | مستخدم يحجز المواعيد ويتابع حالته             |
| Receptionist | يدير المرضى والمواعيد والطابور                |
| Doctor       | يدير الزيارات والسجلات والوصفات               |
| Admin        | يدير المستخدمين والأطباء والإعدادات والتقارير |

يجب أن يكون الوصول إلى الوظائف مبنيًا على صلاحيات الدور.

---

# 6. System Overview

النظام عبارة عن Web Application يتكون من:

1. Frontend Application.
2. Backend REST API.
3. Relational Database.
4. AI Service.
5. Authentication and Authorization Layer.

Architecture مبدئية:

```text
Users
  |
  v
React Frontend
  |
  v
Node.js / Express API
  |
  +----------------------+
  |                      |
  v                      v
PostgreSQL           AI Service
Database             Python/API
```

---

# 7. Functional Requirements

## 7.1 Authentication

### FR-AUTH-01

يجب أن يسمح النظام للمستخدم بتسجيل الدخول باستخدام بيانات الاعتماد الخاصة به.

### FR-AUTH-02

يجب أن يسمح النظام للمستخدمين المسموح لهم بإنشاء حساب.

### FR-AUTH-03

يجب أن يسمح النظام بتسجيل الخروج.

### FR-AUTH-04

يجب أن يدعم النظام تغيير كلمة المرور.

### FR-AUTH-05

يجب أن يتحقق النظام من صحة بيانات الدخول.

### FR-AUTH-06

يجب أن يمنع النظام المستخدم من الوصول إلى موارد غير مسموحة لدوره.

---

# 8. Patient Management

### FR-PAT-01

يجب أن يستطيع المستخدم إنشاء ملف Patient.

### FR-PAT-02

يجب أن يستطيع المريض تحديث بياناته الشخصية الأساسية.

### FR-PAT-03

يجب أن يستطيع Receptionist البحث عن المرضى.

### FR-PAT-04

يجب أن يستطيع Receptionist عرض المعلومات الأساسية للمريض.

### FR-PAT-05

يجب أن يكون لكل Patient سجل تعريف فريد.

---

# 9. Doctor Management

### FR-DOC-01

يجب أن يستطيع Admin إضافة طبيب.

### FR-DOC-02

يجب أن يستطيع Admin تعديل بيانات الطبيب.

### FR-DOC-03

يجب أن يستطيع Admin تفعيل أو تعطيل حساب الطبيب.

### FR-DOC-04

يجب ربط الطبيب بتخصص.

### FR-DOC-05

يجب أن يمتلك الطبيب جدول دوام أو فترات متاحة للمواعيد.

---

# 10. Appointment Management

### FR-APP-01

يجب أن يستطيع Patient مشاهدة الأطباء المتاحين.

### FR-APP-02

يجب أن يستطيع Patient اختيار الطبيب.

### FR-APP-03

يجب أن يستطيع Patient اختيار تاريخ ووقت متاح.

### FR-APP-04

يجب على النظام التحقق من عدم وجود تعارض في المواعيد.

### FR-APP-05

يجب أن يستطيع Patient إنشاء موعد.

### FR-APP-06

يجب أن يستطيع Patient مشاهدة مواعيده.

### FR-APP-07

يجب أن يستطيع Patient إلغاء موعد وفق القواعد المحددة.

### FR-APP-08

يجب أن يستطيع Receptionist تأكيد الموعد أو إدارته.

### FR-APP-09

يجب أن يستطيع Receptionist إعادة جدولة الموعد عند الحاجة.

### FR-APP-10

يجب أن يدعم النظام حالات الموعد التالية:

```text
Pending
Confirmed
Checked-In
In Consultation
Completed
Cancelled
No-Show
```

---

# 11. Queue Management

## 11.1 Purpose

إدارة الطابور هي الوظيفة الأساسية التي تميز QueueNow.

### FR-QUEUE-01

يجب أن يستطيع Receptionist تسجيل وصول المريض.

### FR-QUEUE-02

عند تسجيل الوصول يجب إنشاء Queue Entry للمريض.

### FR-QUEUE-03

يجب أن يحصل المريض على Queue Number.

### FR-QUEUE-04

يجب أن يستطيع المريض مشاهدة رقم طابوره.

### FR-QUEUE-05

يجب أن يستطيع المريض معرفة عدد المرضى قبله.

### FR-QUEUE-06

يجب أن يستطيع Receptionist استدعاء المريض التالي.

### FR-QUEUE-07

يجب أن يستطيع Receptionist تحديث حالة الطابور.

### FR-QUEUE-08

يجب أن يدعم النظام الحالات:

```text
Waiting
Called
In Consultation
Completed
Skipped
```

### FR-QUEUE-09

يجب أن يعرض النظام المريض الذي تتم خدمته حاليًا.

---

# 12. Medical Visit Management

### FR-VISIT-01

يجب أن يستطيع Doctor فتح ملف المريض المخصص للزيارة.

### FR-VISIT-02

يجب أن يستطيع Doctor تسجيل سبب الزيارة.

### FR-VISIT-03

يجب أن يستطيع Doctor تسجيل الأعراض.

### FR-VISIT-04

يجب أن يستطيع Doctor إدخال الملاحظات الطبية.

### FR-VISIT-05

يجب أن يستطيع Doctor تسجيل التشخيص.

### FR-VISIT-06

يجب أن يستطيع Doctor تسجيل خطة العلاج.

### FR-VISIT-07

يجب أن يستطيع Doctor إنهاء الزيارة.

### FR-VISIT-08

يجب حفظ تاريخ الزيارة في سجل المريض.

---

# 13. Prescription Management

### FR-PRES-01

يجب أن يستطيع Doctor إنشاء وصفة للمريض.

### FR-PRES-02

يجب أن يستطيع Doctor إضافة دواء إلى الوصفة.

### FR-PRES-03

يجب أن يتضمن عنصر الوصفة على الأقل:

* Medication Name.
* Dosage.
* Frequency.
* Duration.
* Instructions.

### FR-PRES-04

يجب أن ترتبط الوصفة بالزيارة الطبية.

### FR-PRES-05

يجب أن يستطيع Patient مشاهدة الوصفات المسموح له بالوصول إليها.

---

# 14. Notification Management

### FR-NOT-01

يجب أن يستطيع النظام إنشاء إشعارات داخل التطبيق.

### FR-NOT-02

يجب إرسال إشعار عند تأكيد الموعد.

### FR-NOT-03

يجب إرسال إشعار عند إلغاء الموعد.

### FR-NOT-04

يجب إرسال إشعار عند اقتراب دور المريض.

### FR-NOT-05

يجب إرسال إشعار عند استدعاء المريض.

---

# 15. Admin Management

### FR-ADM-01

يجب أن يمتلك Admin لوحة تحكم.

### FR-ADM-02

يجب أن يستطيع Admin مشاهدة المستخدمين.

### FR-ADM-03

يجب أن يستطيع Admin إدارة الأطباء.

### FR-ADM-04

يجب أن يستطيع Admin إدارة التخصصات.

### FR-ADM-05

يجب أن يستطيع Admin إدارة الخدمات الطبية.

### FR-ADM-06

يجب أن يستطيع Admin تفعيل أو تعطيل المستخدمين عند الحاجة.

---

# 16. Dashboard and Reports

### FR-REP-01

يجب أن يعرض النظام عدد المرضى.

### FR-REP-02

يجب أن يعرض النظام عدد المواعيد.

### FR-REP-03

يجب أن يعرض النظام عدد الزيارات المكتملة.

### FR-REP-04

يجب أن يعرض النظام عدد المواعيد الملغاة.

### FR-REP-05

يجب أن يعرض النظام متوسط وقت الانتظار.

### FR-REP-06

يجب أن يعرض النظام أوقات الازدحام الأساسية عند توفر البيانات.

---

# 17. AI Requirements

AI في QueueNow هو نظام مساعد وليس بديلًا عن الطبيب.

## FR-AI-01 — Waiting Time Prediction

يجب أن يحاول النظام تقدير وقت انتظار المريض اعتمادًا على بيانات مثل:

* عدد المرضى قبله.
* متوسط مدة الزيارة.
* حالة الطبيب.
* وقت اليوم.

Output Example:

```text
Estimated Waiting Time: 18 minutes
```

## FR-AI-02 — Medical Visit Summarization

يمكن للنظام إنشاء ملخص منظم لملاحظات الزيارة لمساعدة الطبيب.

يجب ألا يعتبر الملخص بديلًا عن السجل الأصلي.

## FR-AI-03 — Clinic Analytics

يمكن للنظام تحليل بيانات المواعيد والطوابير وتقديم مؤشرات إدارية مثل:

* Peak Hours.
* Average Waiting Time.
* Appointment Volume.
* No-Show Rate.

## FR-AI-04 — AI Assistant

يمكن توفير مساعد داخلي يجيب عن الأسئلة المسموح بها والمتعلقة ببيانات النظام.

## FR-AI-05 — AI Safety

لا يجوز استخدام AI في النسخة الأولى من النظام لاتخاذ قرار تشخيصي أو علاجي مستقل أو إنشاء وصفة طبية تلقائية.

---

# 18. Business Rules

### BR-01

لا يمكن حجز موعد لطبيب في فترة غير متاحة.

### BR-02

لا يسمح النظام بتعارض موعدين للطبيب في الوقت نفسه.

### BR-03

يجب أن يكون المريض مسجلًا قبل إنشاء موعد.

### BR-04

يمكن إدخال المريض إلى Queue بعد تسجيل وصوله.

### BR-05

لا يمكن للطبيب بدء زيارة لمريض غير مؤهل للدخول إلى عيادته حسب حالة الموعد والطابور.

### BR-06

لا يستطيع Patient تعديل السجل الطبي.

### BR-07

يستطيع Doctor تعديل السجل الطبي ضمن الصلاحيات المحددة.

### BR-08

يستطيع Admin إدارة الحسابات والصلاحيات.

### BR-09

يجب أن تنتقل حالة الزيارة إلى Completed بعد إنهاء الطبيب للزيارة.

### BR-10

كل عملية مهمة على البيانات الطبية يجب أن تكون قابلة للتتبع.

---

# 19. Non-Functional Requirements

## 19.1 Security

### NFR-SEC-01

يجب تخزين كلمات المرور باستخدام Password Hashing.

### NFR-SEC-02

يجب حماية API باستخدام Authentication.

### NFR-SEC-03

يجب تطبيق Role-Based Access Control.

### NFR-SEC-04

يجب التحقق من جميع المدخلات القادمة من المستخدم.

### NFR-SEC-05

يجب عدم تخزين الأسرار البرمجية داخل GitHub.

### NFR-SEC-06

يجب تسجيل العمليات الحساسة باستخدام Audit Logs.

---

## 19.2 Performance

### NFR-PER-01

يجب أن تكون العمليات الأساسية مثل Login وBooking وQueue سريعة في بيئة التشغيل المستهدفة.

### NFR-PER-02

يجب تصميم استعلامات قاعدة البيانات بشكل يمنع الاستعلامات غير الضرورية.

---

## 19.3 Usability

### NFR-USE-01

يجب أن تكون الواجهات بسيطة وواضحة.

### NFR-USE-02

يجب أن يكون النظام Responsive.

### NFR-USE-03

يجب أن تكون الوظائف الأساسية قابلة للوصول بأقل عدد ممكن من الخطوات.

---

## 19.4 Reliability

### NFR-REL-01

يجب التعامل مع الأخطاء دون فقدان البيانات.

### NFR-REL-02

يجب أن يعرض النظام رسائل واضحة عند حدوث خطأ.

### NFR-REL-03

يجب حماية العمليات المهمة من التكرار غير المقصود.

---

## 19.5 Maintainability

### NFR-MNT-01

يجب تقسيم النظام إلى Modules واضحة.

### NFR-MNT-02

يجب اتباع Coding Standards مشتركة.

### NFR-MNT-03

يجب استخدام Git وPull Requests لمراجعة التغييرات.

### NFR-MNT-04

يجب توثيق API والوظائف الأساسية.

---

## 19.6 Scalability

يجب أن يسمح التصميم بإضافة مستقبلية لـ:

* Mobile Application.
* Multiple Clinics.
* Laboratory Integration.
* Pharmacy Integration.
* Online Payments.
* Advanced AI.
* Advanced Reporting.

---

# 20. Data Requirements

البيانات الأساسية المتوقعة في النظام:

```text
Users
Patients
Doctors
Specialties
Services
Doctor Schedules
Appointments
Queue Entries
Medical Visits
Prescriptions
Prescription Items
Notifications
Audit Logs
```

يجب أن تكون العلاقات بين البيانات واضحة ومتسقة، مع استخدام معرفات فريدة لكل سجل.

---

# 21. Main System Workflows

## 21.1 Appointment Workflow

```text
Patient Login
    ↓
Select Doctor
    ↓
Select Date
    ↓
Select Available Slot
    ↓
Confirm Appointment
    ↓
Appointment Created
```

## 21.2 Queue Workflow

```text
Patient Arrives
    ↓
Receptionist Check-In
    ↓
Queue Number Assigned
    ↓
Waiting
    ↓
Patient Called
    ↓
In Consultation
```

## 21.3 Consultation Workflow

```text
Doctor Opens Queue
    ↓
Select Patient
    ↓
Review Patient Information
    ↓
Record Visit
    ↓
Create Prescription
    ↓
Complete Visit
```

---

# 22. Main Use Cases

| ID    | Use Case                | Actor                  |
| ----- | ----------------------- | ---------------------- |
| UC-01 | Register                | Patient                |
| UC-02 | Login                   | All Users              |
| UC-03 | Book Appointment        | Patient                |
| UC-04 | Manage Appointment      | Patient / Receptionist |
| UC-05 | Check-In Patient        | Receptionist           |
| UC-06 | Manage Queue            | Receptionist           |
| UC-07 | View Waiting Patients   | Doctor                 |
| UC-08 | Perform Consultation    | Doctor                 |
| UC-09 | Create Medical Visit    | Doctor                 |
| UC-10 | Create Prescription     | Doctor                 |
| UC-11 | Manage Users            | Admin                  |
| UC-12 | Manage Doctors          | Admin                  |
| UC-13 | View Reports            | Admin                  |
| UC-14 | Predict Waiting Time    | System / AI            |
| UC-15 | Summarize Medical Visit | Doctor / AI            |

---

# 23. MVP Acceptance Criteria

يعتبر الإصدار الأول ناجحًا إذا استطاع النظام تنفيذ السيناريو التالي بنجاح:

```text
1. Patient creates account.
2. Patient logs in.
3. Patient selects doctor.
4. Patient books available appointment.
5. Receptionist sees appointment.
6. Patient checks in.
7. System assigns queue number.
8. Receptionist calls patient.
9. Doctor opens patient.
10. Doctor records medical visit.
11. Doctor creates prescription.
12. Visit is completed.
13. Patient can view appointment/visit information.
14. AI can provide waiting-time estimation.
15. Admin can view basic dashboard statistics.
```

---

# 24. Technical Constraints

بسبب طبيعة المشروع ومدة التنفيذ القصيرة، سيتم الالتزام بالقيود التالية:

1. المشروع MVP وليس نظامًا طبيًا تجاريًا كاملًا.
2. مدة التنفيذ المستهدفة أسبوع واحد.
3. الفريق مكون من متدربين.
4. يجب تجنب التقنيات التي تضيف تعقيدًا غير ضروري.
5. يجب استخدام Architecture بسيطة قابلة للتوسع.
6. يجب إعطاء الأولوية للـCore Workflow.
7. AI سيكون محدودًا بوظائف مساندة قابلة للتنفيذ خلال مدة المشروع.

---

# 25. Assumptions

1. النظام مخصص لعيادة واحدة في النسخة الأولى.
2. المستخدمون لديهم اتصال بالإنترنت.
3. لكل مستخدم حساب وصلاحيات محددة.
4. بيانات الطبيب وجدول عمله يتم إدخالها من Admin.
5. يمكن إضافة خدمات طبية من لوحة الإدارة.
6. جميع المستخدمين يعملون من خلال Web Browser.
7. AI يعتمد على خدمة أو نموذج جاهز عند الحاجة، وليس على تدريب نموذج من الصفر.

---

# 26. Future Enhancements

بعد الانتهاء من MVP يمكن إضافة:

* Mobile Application.
* Multiple Clinic Branches.
* Patient Medical Documents.
* Laboratory Management.
* Pharmacy Management.
* Insurance Management.
* Online Payment.
* SMS/Email Integration.
* Advanced Notifications.
* Advanced AI Analytics.
* Multi-language Support.
* Advanced Medical Reporting.

---

# 27. Definition of Done

لا تعتبر أي Feature مكتملة إلا بعد:

```text
Requirement Defined
      ↓
Development Completed
      ↓
Unit Test / Manual Test
      ↓
Code Review
      ↓
Integration
      ↓
Acceptance Test
      ↓
Documentation Updated
      ↓
Done
```

---

# 28. Conclusion

QueueNow Clinic MVP هو نظام ويب يركز على أهم العمليات اليومية في العيادة، وأبرزها إدارة المرضى والمواعيد والطوابير والزيارات الطبية.

تم تصميم نطاق الإصدار الأول بحيث يكون قابلًا للتنفيذ خلال أسبوع بواسطة فريق من المتدربين، مع الحفاظ على بنية برمجية تسمح بإضافة وظائف أكثر تقدمًا مستقبلًا.

يعتبر هذا المستند المرجع الأساسي لمرحلة System Design وتخطيط قاعدة البيانات وتصميم API وUI/UX وتقسيم مهام الفريق والاختبارات.
