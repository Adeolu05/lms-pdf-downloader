'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Download, Shield, FolderArchive, ArrowLeft, BookOpen } from 'lucide-react';
import { Button, Card, Badge, Input, cn } from '@/components/ui';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AppShell } from '@/components/layout/AppShell';
import { CourseCard } from '@/components/features/course/CourseCard';
import { useAppContext } from '@/lib/context';

export default function CoursesPage() {
    const router = useRouter();
    const { courses, addCourse, removeCourse, setCourses, startDownloads } = useAppContext();
    const [newUrl, setNewUrl] = useState('');

    const handleAddCourse = () => {
        if (!newUrl) return;
        addCourse(newUrl);
        setNewUrl('');
    };

    const handleStartDownloads = () => {
        startDownloads();
        router.push('/progress');
    };

    return (
        <AppShell
            headerAction={
                <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
                    <ArrowLeft size={18} className="mr-1" />
                    <span className="font-extrabold uppercase tracking-wide text-xs">Back</span>
                </Button>
            }
        >
            <div className="flex flex-col max-w-[800px] mx-auto gap-10">
                {/* Page Section Header */}
                <SectionHeader
                    title="Download Course Materials"
                    description="Paste one or more LMS course links to scan and download all available PDFs. We support Canvas, Blackboard, and Moodle."
                />

                {/* Course URL Input Section */}
                <Card className="bg-surface p-7 shadow-hard">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <span className="text-heading text-xs font-black uppercase tracking-widest">LMS Course URL</span>
                            <span className="text-xs text-muted font-medium hidden sm:block">Press ⏎ to add</span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Input
                                className="flex-1"
                                placeholder="https://canvas.instructure.com/courses/12345"
                                type="url"
                                value={newUrl}
                                onChange={(e) => setNewUrl(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddCourse()}
                            />
                            <Button onClick={handleAddCourse} className="py-3 px-7 text-sm whitespace-nowrap">
                                <Plus size={18} className="mr-1" />
                                <span>Add Course</span>
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Courses Display List */}
                <div className="flex flex-col gap-5 mt-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-heading text-2xl font-black tracking-tight">Added Courses</h3>
                        <Badge variant="primary" className="shadow-[2px_2px_0px_#111111]">{courses.length} Courses Added</Badge>
                    </div>

                    <div className="flex flex-col gap-4">
                        {courses.length === 0 ? (
                            <div className="flex flex-col items-center text-center py-16 text-muted border-[3px] border-dashed border-border/30 rounded-card bg-surface-alt/50 animate-fade-in-up">
                                <div className="w-16 h-16 bg-lilac/20 rounded-2xl flex items-center justify-center mb-4 border-2 border-border/10">
                                    <BookOpen size={28} className="text-muted/60" />
                                </div>
                                <p className="font-bold text-heading text-lg mb-1">No courses added yet</p>
                                <p className="text-sm font-medium text-muted max-w-xs">Paste an LMS course URL above and hit <strong className="text-heading">Add Course</strong> to get started.</p>
                            </div>
                        ) : (
                            courses.map((course) => (
                                <CourseCard
                                    key={course.id}
                                    url={course.url}
                                    name={course.name}
                                    onRemove={() => removeCourse(course.id)}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Course Action Buttons */}
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t-[2px] border-border/10 pt-8 pb-10">
                    <button
                        className="w-full sm:w-auto text-sm font-bold text-muted hover:text-heading transition-all duration-200 px-5 py-3 hover:bg-error/10 rounded-btn flex items-center justify-center gap-2"
                        onClick={() => setCourses([])}
                    >
                        Clear All Courses
                    </button>
                    <Button
                        className="w-full sm:w-auto px-10 py-4 text-base"
                        onClick={handleStartDownloads}
                        disabled={courses.length === 0}
                    >
                        <Download size={20} className="mr-2" />
                        <span>Download Materials</span>
                    </Button>
                </div>

                {/* Information Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                    <div className="p-6 rounded-[20px] bg-mint/20 border-[2px] border-border flex gap-4 shadow-hard hover:-translate-y-1 hover:shadow-hard-lg transition-all duration-200 animate-fade-in-up stagger-2">
                        <div className="p-3 bg-mint rounded-[14px] border-[2px] border-border flex-shrink-0 h-fit shadow-hard-sm">
                            <Shield className="text-heading" size={22} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-heading tracking-tight mb-1">Secure Scan</p>
                            <p className="text-sm text-muted leading-relaxed">Your credentials are never stored. We only access public and authorized files.</p>
                        </div>
                    </div>
                    <div className="p-6 rounded-[20px] bg-lilac/20 border-[2px] border-border flex gap-4 shadow-hard hover:-translate-y-1 hover:shadow-hard-lg transition-all duration-200 animate-fade-in-up stagger-3">
                        <div className="p-3 bg-lilac rounded-[14px] border-[2px] border-border flex-shrink-0 h-fit shadow-hard-sm">
                            <FolderArchive className="text-heading" size={22} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-heading tracking-tight mb-1">Bulk Export</p>
                            <p className="text-sm text-muted leading-relaxed">All PDFs will be organized into folders by course and course module.</p>
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
