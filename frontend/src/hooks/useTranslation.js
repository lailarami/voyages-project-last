import useAuthStore from '@/store/authStore'
import { translate, formatCurrency, formatDate, getDirection } from '@/i18n'

export default function useTranslation() {
    const { language, setLanguage } = useAuthStore((state) => ({
        language: state.language,
        setLanguage: state.setLanguage,
    }))

    return {
        t: (key) => translate(key, language),
        formatCurrency: (value) => formatCurrency(value, language),
        formatDate: (value, options) => formatDate(value, language, options),
        language,
        setLanguage,
        dir: getDirection(language),
    }
}
