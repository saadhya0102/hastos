import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { SlavaProvider } from "@/lib/slava";
import { AppShell } from "@/components/AppShell";
import { Dashboard } from "@/pages/Dashboard";
import { Learn } from "@/pages/Learn";
import { ModulePage } from "@/pages/ModulePage";
import { LessonPage } from "@/pages/LessonPage";
import { Problems } from "@/pages/Problems";
import { ProblemPage } from "@/pages/ProblemPage";
import { Interview } from "@/pages/Interview";
import { MockInterview } from "@/pages/MockInterview";
import { Tests } from "@/pages/Tests";
import { Review } from "@/pages/Review";
import { Playground } from "@/pages/Playground";
import { Profile } from "@/pages/Profile";
import { Login } from "@/pages/Login";
import { Signup } from "@/pages/Signup";
import { Admin } from "@/pages/Admin";
import { NotFound } from "@/pages/NotFound";

export default function App() {
  return (
    <AuthProvider>
      <SlavaProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<Dashboard />} />
              <Route path="learn" element={<Learn />} />
              <Route path="learn/:moduleId" element={<ModulePage />} />
              <Route path="learn/:moduleId/:lessonId" element={<LessonPage />} />
              <Route path="problems" element={<Problems />} />
              <Route path="problems/:problemId" element={<ProblemPage />} />
              <Route path="interview" element={<Interview />} />
              <Route path="mock-interview" element={<MockInterview />} />
              <Route path="tests" element={<Tests />} />
              <Route path="review" element={<Review />} />
              <Route path="playground" element={<Playground />} />
              <Route path="profile" element={<Profile />} />
              <Route path="admin" element={<Admin />} />
              <Route path="login" element={<Login />} />
              <Route path="signup" element={<Signup />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SlavaProvider>
    </AuthProvider>
  );
}
