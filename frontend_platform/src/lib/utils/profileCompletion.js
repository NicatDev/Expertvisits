export function calculateProfileCompletion(profile = {}, currentUser = {}) {
    const summary = profile.summary !== undefined ? profile.summary : currentUser.summary;
    const phone = profile.phone_number !== undefined ? profile.phone_number : currentUser.phone_number;
    const profession =
        profile.profession_sub_category !== undefined
            ? profile.profession_sub_category
            : currentUser.profession_sub_category;
    const birthDay =
        profile.birth_day !== undefined
            ? profile.birth_day
            : profile.birth_date !== undefined
              ? profile.birth_date
              : currentUser.birth_day;

    const requiredFields = [
        !!summary,
        !!(profile.first_name !== undefined ? profile.first_name : currentUser.first_name),
        !!(profile.last_name !== undefined ? profile.last_name : currentUser.last_name),
        !!(profile.username !== undefined ? profile.username : currentUser.username),
        !!(profile.email !== undefined ? profile.email : currentUser.email),
        !!phone,
        !!birthDay,
        !!(profile.city !== undefined ? profile.city : currentUser.city),
        !!profession,
        !!(profile.experience && profile.experience.length > 0),
        !!(profile.education && profile.education.length > 0),
        !!(profile.skills && profile.skills.some((skill) => skill.skill_type === 'hard')),
        !!(profile.skills && profile.skills.some((skill) => skill.skill_type === 'soft')),
        !!(profile.languages && profile.languages.length > 0),
        !!(profile.certificates && profile.certificates.length > 0),
    ];

    const completed = requiredFields.filter(Boolean).length;
    return Math.round((completed / requiredFields.length) * 100);
}
