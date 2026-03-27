import { Sparkles } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'
import { CHANGELOG } from '../../data/changelog'
import React from 'react'

interface WhatsNewModalProps {
    open: boolean
    onClose: () => void
}

export function WhatsNewModal({ open, onClose }: WhatsNewModalProps) {
    return (
        <Modal open={open} onClose={onClose} title="Novedades de la App">
            <div className="space-y-6 pt-2 pb-4">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center animate-bounce-subtle">
                        <Sparkles size={32} />
                    </div>
                </div>

                <div className="space-y-8 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                    {CHANGELOG.map((entry, index) => (
                        <div key={entry.version} className={index > 0 ? "pt-6 border-t border-gray-100 dark:border-white/10" : ""}>
                            <div className="flex items-baseline gap-2 mb-4">
                                <h2 className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md">
                                    v{entry.version}
                                </h2>
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">{entry.title}</h3>
                            </div>
                            
                            <div className="space-y-5">
                                {entry.features.map((feature, fIndex) => (
                                    <div key={fIndex} className="flex gap-4">
                                        <div className="shrink-0 mt-1 text-blue-600 dark:text-blue-400">
                                            {React.createElement(feature.icon, { size: 24 })}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white text-[15px]">{feature.title}</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                                                {feature.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-4">
                    <Button fullWidth size="lg" onClick={onClose}>
                        ¡A entrenar! 🚀
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
